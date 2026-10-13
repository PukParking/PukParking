import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { once } from "node:events";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

import { initializeDatabase } from "../../data/initialize.js";
import { provisionFirstAdministrator } from "../admin/provisionFirstAdministrator.js";
import { createApp } from "../app.js";

const TEST_JWT_SECRET = "test-only-signing-secret-at-least-32-bytes";
const TEST_CLIENT_ORIGIN = "http://localhost:5173";
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(currentDirectory, "../../data/tableStructure.sql");

async function createParkingTestServer() {
    const database = new Database(":memory:");
    initializeDatabase(database, readFileSync(schemaPath, "utf8"));
    const administrator = await provisionFirstAdministrator(
        database,
        "admin@example.com",
        "correct horse battery staple",
    );
    const buildingId = randomUUID();
    database
        .prepare(`
            INSERT INTO BUILDING (
                Building_ID,
                Administrator_ID,
                Building_Name,
                Building_Abbreviation,
                Building_Latitude,
                Building_Longitude
            ) VALUES (?, ?, ?, ?, ?, ?)
        `)
        .run(buildingId, administrator.id, "Engineering", "ENG", -26.68, 27.1);
    const activeAreaId = randomUUID();
    database
        .prepare(`
            INSERT INTO PARKING_AREA (
                Parking_Area_ID,
                Administrator_ID,
                Building_ID,
                Parking_Area_Name,
                Parking_Type,
                Parking_Area_Capacity,
                Parking_Area_Occupied_Spaces,
                Parking_Area_Latitude,
                Parking_Area_Longitude,
                Parking_Area_isActive
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
            activeAreaId,
            administrator.id,
            buildingId,
            "Engineering North",
            "Student",
            40,
            6,
            -26.681,
            27.101,
            1,
        );
    const inactiveAreaId = randomUUID();
    database
        .prepare(`
            INSERT INTO PARKING_AREA (
                Parking_Area_ID,
                Administrator_ID,
                Building_ID,
                Parking_Area_Name,
                Parking_Type,
                Parking_Area_Capacity,
                Parking_Area_Occupied_Spaces,
                Parking_Area_Latitude,
                Parking_Area_Longitude,
                Parking_Area_isActive
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
            inactiveAreaId,
            administrator.id,
            buildingId,
            "Closed Lot",
            "Guest",
            10,
            0,
            -26.682,
            27.102,
            0,
        );
    const server = createApp({
        database,
        jwtSecret: TEST_JWT_SECRET,
        clientOrigin: TEST_CLIENT_ORIGIN,
    }).listen(0);
    await once(server, "listening");

    return {
        database,
        server,
        port: server.address().port,
        activeAreaId,
        inactiveAreaId,
    };
}

async function closeParkingTestServer({ database, server }) {
    await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
    });
    database.close();
}

test("public parking list uses stored occupancy and hides inactive areas", async () => {
    const testServer = await createParkingTestServer();

    try {
        const response = await fetch(
            `http://localhost:${testServer.port}/api/parking/areas`,
        );
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.deepEqual(body.parkingAreas, [
            {
                id: testServer.activeAreaId,
                name: "Engineering North",
                category: "Student",
                capacity: 40,
                occupied: 6,
                available: 34,
                isFull: false,
                fullUntil: null,
                buildingName: "Engineering",
                coordinates: [27.101, -26.681],
            },
        ]);
    } finally {
        await closeParkingTestServer(testServer);
    }
});

test("full report forces zero availability until its expiry, then stored occupancy applies", async () => {
    const testServer = await createParkingTestServer();

    try {
        const now = Date.now();
        testServer.database
            .prepare(`
                INSERT INTO PARKING_FULL_REPORT (
                    Report_ID,
                    Parking_Area_ID,
                    Report_Submitted_Time,
                    Report_Expiry_Time
                ) VALUES (?, ?, ?, ?), (?, ?, ?, ?)
            `)
            .run(
                randomUUID(),
                testServer.activeAreaId,
                new Date(now - 60_000).toISOString(),
                new Date(now + 10 * 60_000).toISOString(),
                randomUUID(),
                testServer.activeAreaId,
                new Date(now - 60 * 60_000).toISOString(),
                new Date(now - 30 * 60_000).toISOString(),
            );

        const response = await fetch(
            `http://localhost:${testServer.port}/api/parking/areas`,
        );
        const body = await response.json();

        assert.equal(body.parkingAreas[0].isFull, true);
        assert.equal(body.parkingAreas[0].occupied, 40);
        assert.equal(body.parkingAreas[0].available, 0);

        testServer.database
            .prepare("UPDATE PARKING_FULL_REPORT SET Report_Expiry_Time = ? WHERE Parking_Area_ID = ?")
            .run(
                new Date(Date.now() - 60_000).toISOString(),
                testServer.activeAreaId,
            );
        const afterExpiryResponse = await fetch(
            `http://localhost:${testServer.port}/api/parking/areas`,
        );
        const afterExpiryBody = await afterExpiryResponse.json();

        assert.equal(afterExpiryBody.parkingAreas[0].isFull, false);
        assert.equal(afterExpiryBody.parkingAreas[0].occupied, 6);
        assert.equal(afterExpiryBody.parkingAreas[0].available, 34);
    } finally {
        await closeParkingTestServer(testServer);
    }
});

test("parking full report records UTC timestamps with a 30-minute expiry and is idempotent", async () => {
    const testServer = await createParkingTestServer();

    try {
        const submit = () => fetch(
            `http://localhost:${testServer.port}/api/parking/areas/${testServer.activeAreaId}/full-report`,
            {
                method: "POST",
                headers: {
                    Origin: TEST_CLIENT_ORIGIN,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            },
        );
        const response = await submit();
        const body = await response.json();
        const report = testServer.database
            .prepare(`
                SELECT Report_Submitted_Time AS submittedAt,
                    Report_Expiry_Time AS expiresAt
                FROM PARKING_FULL_REPORT
                WHERE Parking_Area_ID = ?
                ORDER BY Report_Expiry_Time DESC
            `)
            .get(testServer.activeAreaId);
        const duplicateResponse = await submit();

        assert.equal(response.status, 200);
        assert.equal(body.parkingArea.isFull, true);
        assert.equal(body.parkingArea.available, 0);
        assert.equal(body.reportExpiresInSeconds, 1800);
        assert.match(report.submittedAt, /^\d{4}-\d{2}-\d{2}T.*Z$/);
        assert.match(report.expiresAt, /^\d{4}-\d{2}-\d{2}T.*Z$/);
        assert.equal(
            new Date(report.expiresAt).getTime() -
                new Date(report.submittedAt).getTime(),
            30 * 60 * 1000,
        );
        assert.equal(duplicateResponse.status, 200);
        assert.equal(
            testServer.database
                .prepare("SELECT COUNT(*) AS count FROM PARKING_FULL_REPORT WHERE Parking_Area_ID = ?")
                .get(testServer.activeAreaId).count,
            1,
        );
    } finally {
        await closeParkingTestServer(testServer);
    }
});

test("full-report submission rejects invalid IDs and inactive areas from any origin", async () => {
    const testServer = await createParkingTestServer();

    try {
        const request = (id, origin = TEST_CLIENT_ORIGIN) => fetch(
            `http://localhost:${testServer.port}/api/parking/areas/${id}/full-report`,
            {
                method: "POST",
                headers: { Origin: origin },
                body: "{}",
            },
        );
        const invalidId = await request("not-an-id");
        const inactive = await request(testServer.inactiveAreaId);
        const otherOrigin = await request(
            testServer.activeAreaId,
            "https://untrusted.example",
        );

        assert.equal(invalidId.status, 400);
        assert.equal(inactive.status, 404);
        assert.equal(otherOrigin.status, 200);
        assert.equal(
            testServer.database
                .prepare("SELECT COUNT(*) AS count FROM PARKING_FULL_REPORT")
                .get().count,
            1,
        );
    } finally {
        await closeParkingTestServer(testServer);
    }
});
