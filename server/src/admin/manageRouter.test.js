import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { once } from "node:events";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";

import { initializeDatabase } from "../../data/initialize.js";
import { provisionFirstAdministrator } from "./provisionFirstAdministrator.js";
import { createApp } from "../app.js";

const TEST_JWT_SECRET = "test-only-signing-secret-at-least-32-bytes";
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(currentDirectory, "../../data/table structure.sql");
const schema = readFileSync(schemaPath, "utf8");

async function createManageTestServer() {
    const database = new Database(":memory:");
    initializeDatabase(database, schema);
    const administrator = await provisionFirstAdministrator(
        database,
        "admin@example.com",
        "correct horse battery staple",
    );
    const building = database
        .prepare(`
            INSERT INTO BUILDING (
                Administrator_ID,
                Building_Name,
                Building_Abbreviation,
                Building_Latitude,
                Building_Longitude
            ) VALUES (?, ?, ?, ?, ?)
        `)
        .run(administrator.lastInsertRowid, "Engineering", "ENG", -26.68, 27.1);
    const token = jwt.sign(
        { email: "admin@example.com" },
        TEST_JWT_SECRET,
        { algorithm: "HS256", subject: String(administrator.lastInsertRowid), expiresIn: "5m" },
    );
    const server = createApp({
        database,
        jwtSecret: TEST_JWT_SECRET,
        clientOrigin: "http://localhost:5173",
    }).listen(0);
    await once(server, "listening");

    return {
        database,
        server,
        port: server.address().port,
        buildingId: Number(building.lastInsertRowid),
        cookie: `pukparking_admin_token=${token}`,
    };
}

async function request(port, path, { method = "GET", body, cookie } = {}) {
    return fetch(`http://localhost:${port}/api/admin${path}`, {
        method,
        headers: {
            ...(body === undefined ? {} : { "Content-Type": "application/json" }),
            ...(cookie ? { Cookie: cookie } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
}

async function closeTestServer({ database, server }) {
    await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
    });
    database.close();
}

test("admin management routes reject requests without a valid session", async () => {
    const testServer = await createManageTestServer();

    try {
        const response = await request(testServer.port, "/buildings");

        assert.equal(response.status, 401);
        assert.deepEqual(await response.json(), {
            error: "Authentication required",
        });
    } finally {
        await closeTestServer(testServer);
    }
});

test("admin can create, list, update, and delete buildings and parking areas", async () => {
    const testServer = await createManageTestServer();
    const { port, cookie, buildingId } = testServer;

    try {
        const createdBuildingResponse = await request(port, "/buildings", {
            method: "POST",
            cookie,
            body: {
                name: "Library",
                code: "LIB",
                latitude: "-26.681",
                longitude: "27.102",
            },
        });
        const createdBuildingBody = await createdBuildingResponse.json();
        assert.equal(createdBuildingResponse.status, 201);
        assert.equal(createdBuildingBody.building.name, "Library");
        const newBuildingId = createdBuildingBody.building.id;

        const createdParkingResponse = await request(port, "/parking-areas", {
            method: "POST",
            cookie,
            body: {
                name: "North Lot",
                category: "Student",
                capacity: 45,
                buildingId: newBuildingId,
                latitude: -26.682,
                longitude: 27.103,
            },
        });
        const createdParkingBody = await createdParkingResponse.json();
        assert.equal(createdParkingResponse.status, 201);
        assert.equal(createdParkingBody.parkingArea.buildingId, newBuildingId);

        const listParkingResponse = await request(port, "/parking-areas", {
            cookie,
        });
        const listedParking = (await listParkingResponse.json()).parkingAreas;
        assert.equal(listedParking.length, 1);
        assert.equal(listedParking[0].buildingName, "Library");

        const updatedParkingResponse = await request(
            port,
            `/parking-areas/${createdParkingBody.parkingArea.id}`,
            {
                method: "PUT",
                cookie,
                body: {
                    name: "North Lot Updated",
                    category: "Staff",
                    capacity: 50,
                    buildingId,
                    latitude: -26.683,
                    longitude: 27.104,
                },
            },
        );
        assert.equal(updatedParkingResponse.status, 200);
        assert.equal(
            (await updatedParkingResponse.json()).parkingArea.name,
            "North Lot Updated",
        );

        const deletedParking = await request(
            port,
            `/parking-areas/${createdParkingBody.parkingArea.id}`,
            { method: "DELETE", cookie },
        );
        assert.equal(deletedParking.status, 204);

        const deletedBuilding = await request(
            port,
            `/buildings/${newBuildingId}`,
            { method: "DELETE", cookie },
        );
        assert.equal(deletedBuilding.status, 204);
    } finally {
        await closeTestServer(testServer);
    }
});

test("dashboard reports live capacity and occupancy totals for active parking areas", async () => {
    const testServer = await createManageTestServer();
    const { database, port, cookie, buildingId } = testServer;

    try {
        database
            .prepare(`
                INSERT INTO PARKING_AREA (
                    Administrator_ID,
                    Building_ID,
                    Parking_Area_Name,
                    Parking_Area_Capacity,
                    Parking_Area_Occupied_Spaces,
                    Parking_Area_isActive
                ) VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)
            `)
            .run(
                1, buildingId, "North Lot", 40, 12, 1,
                1, buildingId, "Closed Lot", 20, 5, 0,
            );

        const response = await request(port, "/dashboard", { cookie });
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.deepEqual(body.summary, {
            totalSpaces: 40,
            occupiedSpaces: 12,
            availableSpaces: 28,
            parkingAreas: 1,
            buildings: 1,
        });
        assert.deepEqual(body.parkingAreas, [
            {
                id: 1,
                name: "North Lot",
                buildingName: "Engineering",
                capacity: 40,
                occupied: 12,
                available: 28,
                isFull: false,
            },
        ]);
    } finally {
        await closeTestServer(testServer);
    }
});

test("dashboard treats only non-expired full reports as full parking areas", async () => {
    const testServer = await createManageTestServer();
    const { database, port, cookie, buildingId } = testServer;

    try {
        database
            .prepare(`
                INSERT INTO PARKING_AREA (
                    Administrator_ID,
                    Building_ID,
                    Parking_Area_Name,
                    Parking_Area_Capacity,
                    Parking_Area_Occupied_Spaces,
                    Parking_Area_isActive
                ) VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)
            `)
            .run(
                1, buildingId, "Active Report Lot", 40, 7, 1,
                1, buildingId, "Expired Report Lot", 20, 5, 1,
            );
        const activeAreaId = database
            .prepare("SELECT Parking_Area_ID AS id FROM PARKING_AREA WHERE Parking_Area_Name = ?")
            .get("Active Report Lot").id;
        const expiredAreaId = database
            .prepare("SELECT Parking_Area_ID AS id FROM PARKING_AREA WHERE Parking_Area_Name = ?")
            .get("Expired Report Lot").id;
        const now = Date.now();
        database
            .prepare(`
                INSERT INTO PARKING_FULL_REPORT (
                    Parking_Area_ID,
                    Report_Submitted_Time,
                    Report_Expiry_Time
                ) VALUES (?, ?, ?), (?, ?, ?)
            `)
            .run(
                activeAreaId,
                new Date(now - 60_000).toISOString(),
                new Date(now + 10 * 60_000).toISOString(),
                expiredAreaId,
                new Date(now - 60 * 60_000).toISOString(),
                new Date(now - 30 * 60_000).toISOString(),
            );

        const response = await request(port, "/dashboard", { cookie });
        const body = await response.json();
        const activeArea = body.parkingAreas.find(
            (area) => area.name === "Active Report Lot",
        );
        const expiredArea = body.parkingAreas.find(
            (area) => area.name === "Expired Report Lot",
        );

        assert.equal(response.status, 200);
        assert.deepEqual(
            {
                capacity: activeArea.capacity,
                occupied: activeArea.occupied,
                available: activeArea.available,
                isFull: activeArea.isFull,
            },
            { capacity: 40, occupied: 40, available: 0, isFull: true },
        );
        assert.deepEqual(
            {
                capacity: expiredArea.capacity,
                occupied: expiredArea.occupied,
                available: expiredArea.available,
                isFull: expiredArea.isFull,
            },
            { capacity: 20, occupied: 5, available: 15, isFull: false },
        );
        assert.deepEqual(body.summary, {
            totalSpaces: 60,
            occupiedSpaces: 45,
            availableSpaces: 15,
            parkingAreas: 2,
            buildings: 1,
        });
    } finally {
        await closeTestServer(testServer);
    }
});

test("management validates inputs and prevents deleting a building with parking areas", async () => {
    const testServer = await createManageTestServer();
    const { port, cookie, buildingId, database } = testServer;

    try {
        const invalidParking = await request(port, "/parking-areas", {
            method: "POST",
            cookie,
            body: {
                name: "Bad Coordinates",
                category: "Student",
                capacity: 10,
                buildingId,
                latitude: 100,
                longitude: 27,
            },
        });
        assert.equal(invalidParking.status, 400);

        const parking = database
            .prepare(`
                INSERT INTO PARKING_AREA (
                    Administrator_ID,
                    Building_ID,
                    Parking_Area_Name
                ) VALUES (?, ?, ?)
            `)
            .run(1, buildingId, "Existing Lot");
        assert.ok(parking.lastInsertRowid);

        const deleteBuilding = await request(
            port,
            `/buildings/${buildingId}`,
            { method: "DELETE", cookie },
        );
        assert.equal(deleteBuilding.status, 409);
        assert.match((await deleteBuilding.json()).error, /parking areas/);
    } finally {
        await closeTestServer(testServer);
    }
});

test("parking-area create rejects a building that does not exist", async () => {
    const testServer = await createManageTestServer();

    try {
        const response = await request(testServer.port, "/parking-areas", {
            method: "POST",
            cookie: testServer.cookie,
            body: {
                name: "Unassigned Lot",
                category: "Guest",
                capacity: 5,
                buildingId: 9999,
                latitude: 0,
                longitude: 0,
            },
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
            error: "Selected building does not exist.",
        });
    } finally {
        await closeTestServer(testServer);
    }
});

test("parking areas with reports cannot be deleted", async () => {
    const testServer = await createManageTestServer();
    const parkingArea = testServer.database
        .prepare(`
            INSERT INTO PARKING_AREA (
                Administrator_ID,
                Building_ID,
                Parking_Area_Name
            ) VALUES (?, ?, ?)
        `)
        .run(1, testServer.buildingId, "Reported Lot");
    testServer.database
        .prepare(`
            INSERT INTO PARKING_FULL_REPORT (
                Parking_Area_ID,
                Report_Submitted_Time
            ) VALUES (?, ?)
        `)
        .run(parkingArea.lastInsertRowid, "2026-10-09T09:00:00Z");

    try {
        const response = await request(
            testServer.port,
            `/parking-areas/${parkingArea.lastInsertRowid}`,
            { method: "DELETE", cookie: testServer.cookie },
        );

        assert.equal(response.status, 409);
        assert.deepEqual(await response.json(), {
            error: "A parking area with reports cannot be deleted.",
        });
    } finally {
        await closeTestServer(testServer);
    }
});
