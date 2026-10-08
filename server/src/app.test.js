import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import jwt from "jsonwebtoken";
import test from "node:test";

import "dotenv/config";

import database from "../data/db.js";

process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const TEST_JWT_SECRET = "server-app-tests-only-secret-32-bytes-minimum";
process.env.JWT_SECRET = TEST_JWT_SECRET;

const { default: app } = await import("./app.js");

test("health endpoint returns status and security headers", async () => {
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(`http://localhost:${port}/api/health`, {
            headers: {
                Origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
            },
        });

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { status: "ok" });
        assert.equal(response.headers.get("x-content-type-options"), "nosniff");
        assert.equal(response.headers.get("x-powered-by"), null);
        assert.equal(
            response.headers.get("access-control-allow-origin"),
            process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
        );
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("parking areas endpoint returns database rows as a JSON array", async () => {
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(`http://localhost:${port}/api/parking-areas`);

        assert.equal(response.status, 200);
        assert.equal(response.headers.get("content-type")?.includes("application/json"), true);
        const parkingAreas = await response.json();
        assert.equal(Array.isArray(parkingAreas), true);
        assert.equal(parkingAreas.length, 6);
        const visitorsLot = parkingAreas.find(
            (area) => area.Parking_Area_Name === "Hoffman St / Main Gate Visitors",
        );
        assert.equal(visitorsLot.availableBays, 11);
        assert.equal(visitorsLot.status, "open");
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("buildings endpoint returns seeded buildings as JSON", async () => {
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(`http://localhost:${port}/api/buildings`);
        const buildings = await response.json();

        assert.equal(response.status, 200);
        assert.equal(Array.isArray(buildings), true);
        assert.equal(buildings.length, 6);
        assert.equal(
            buildings.some((building) => building.Building_Abbreviation === "F1"),
            true,
        );
        const calibratedCoordinates = new Map([
            ["E7", [27.0968, -26.6888]],
            ["F1", [27.0954, -26.6896]],
            ["G3", [27.0975, -26.6876]],
            ["F14", [27.094, -26.6885]],
            ["F12", [27.0949, -26.689]],
            ["N1", [27.091, -26.6835]],
        ]);
        for (const building of buildings) {
            assert.deepEqual(
                [
                    building.Building_Longitude,
                    building.Building_Latitude,
                ],
                calibratedCoordinates.get(building.Building_Abbreviation),
            );
        }
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("admin parking area endpoints require an admin token", async () => {
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(
            `http://localhost:${port}/api/admin/parking-areas`,
        );
        assert.equal(response.status, 401);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("admin login issues a token for a valid database account", async () => {
    const administratorId = randomUUID();
    const username = `test-admin-${administratorId}`;
    const password = "test-only-long-admin-password";
    database
        .prepare(`
            INSERT INTO ADMINISTRATOR (
                Administrator_ID,
                Administrator_Username,
                Administrator_passwordHash
            ) VALUES (?, ?, ?)
        `)
        .run(administratorId, username, bcrypt.hashSync(password, 4));

    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(`http://localhost:${port}/api/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        const result = await response.json();
        assert.equal(response.status, 200);
        assert.equal(result.username, username);
        assert.equal(typeof result.token, "string");

        const protectedResponse = await fetch(
            `http://localhost:${port}/api/admin/parking-areas`,
            { headers: { Authorization: `Bearer ${result.token}` } },
        );
        assert.equal(protectedResponse.status, 200);
    } finally {
        database
            .prepare("DELETE FROM ADMINISTRATOR WHERE Administrator_ID = ?")
            .run(administratorId);
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("admin can view and update parking availability and active status", async () => {
    const administrator = database
        .prepare("SELECT Administrator_ID FROM ADMINISTRATOR LIMIT 1")
        .get();
    const area = database
        .prepare("SELECT * FROM PARKING_AREA WHERE Parking_Area_Capacity > 1 LIMIT 1")
        .get();
    assert.ok(administrator);
    assert.ok(area);
    const token = jwt.sign(
        { sub: administrator.Administrator_ID, role: "admin" },
        TEST_JWT_SECRET,
        { algorithm: "HS256", expiresIn: "5m" },
    );
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
        const listResponse = await fetch(
            `http://localhost:${port}/api/admin/parking-areas`,
            { headers },
        );
        const areas = await listResponse.json();
        assert.equal(listResponse.status, 200);
        assert.equal(areas.length, 6);
        assert.ok("Parking_Area_Occupied_Spaces" in areas[0]);

        const updateResponse = await fetch(
            `http://localhost:${port}/api/admin/parking-areas/${area.Parking_Area_ID}`,
            {
                method: "PATCH",
                headers,
                body: JSON.stringify({ availableBays: 1, isActive: false }),
            },
        );
        const updatedArea = await updateResponse.json();
        assert.equal(updateResponse.status, 200);
        assert.equal(updatedArea.availableBays, 1);
        assert.equal(updatedArea.Parking_Area_IsActive, 0);

        const publicAreasResponse = await fetch(
            `http://localhost:${port}/api/parking-areas`,
        );
        const publicAreas = await publicAreasResponse.json();
        assert.equal(
            publicAreas.some((item) => item.Parking_Area_ID === area.Parking_Area_ID),
            false,
        );
    } finally {
        database
            .prepare(`
                UPDATE PARKING_AREA
                SET Parking_Area_Occupied_Spaces = ?, Parking_Area_IsActive = ?
                WHERE Parking_Area_ID = ?
            `)
            .run(
                area.Parking_Area_Occupied_Spaces,
                area.Parking_Area_IsActive,
                area.Parking_Area_ID,
            );
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("admin can view submitted parking-full reports", async () => {
    const administrator = database
        .prepare("SELECT Administrator_ID FROM ADMINISTRATOR LIMIT 1")
        .get();
    assert.ok(administrator);
    const token = jwt.sign(
        { sub: administrator.Administrator_ID, role: "admin" },
        TEST_JWT_SECRET,
        { algorithm: "HS256", expiresIn: "5m" },
    );
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(`http://localhost:${port}/api/admin/reports`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const reports = await response.json();
        assert.equal(response.status, 200);
        assert.equal(Array.isArray(reports), true);
        assert.ok(reports.every((report) => "Parking_Area_Name" in report));
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("full report marks a parking area full until report expiry", async () => {
    const parkingArea = database
        .prepare("SELECT Parking_Area_ID FROM PARKING_AREA WHERE Parking_Area_Capacity > Parking_Area_Occupied_Spaces LIMIT 1")
        .get();
    assert.ok(parkingArea);

    const server = app.listen(0);
    await once(server, "listening");
    let reportId;

    try {
        const { port } = server.address();
        const response = await fetch(
            `http://localhost:${port}/api/parking-areas/${parkingArea.Parking_Area_ID}/report-full`,
            { method: "POST" },
        );
        const report = await response.json();
        reportId = report.Report_ID;

        assert.equal(response.status, 201);
        assert.match(reportId, /^[0-9a-f-]{36}$/i);
        assert.equal(
            database
                .prepare("SELECT Report_Expiry_Time > CURRENT_TIMESTAMP AS isFuture FROM PARKING_FULL_REPORT WHERE Report_ID = ?")
                .get(reportId).isFuture,
            1,
        );

        const areasResponse = await fetch(`http://localhost:${port}/api/parking-areas`);
        const areas = await areasResponse.json();
        const reportedArea = areas.find(
            (area) => area.Parking_Area_ID === parkingArea.Parking_Area_ID,
        );
        assert.equal(reportedArea.status, "full");
    } finally {
        if (reportId) {
            database
                .prepare("DELETE FROM PARKING_FULL_REPORT WHERE Report_ID = ?")
                .run(reportId);
        }
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("reporting a missing parking area returns 404", async () => {
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(
            `http://localhost:${port}/api/parking-areas/${randomUUID()}/report-full`,
            { method: "POST" },
        );

        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), { error: "Parking area not found" });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("unknown routes return a JSON 404", async () => {
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(
            `http://localhost:${port}/api/does-not-exist`,
        );

        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), { error: "Not found" });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("malformed JSON returns a JSON 400", async () => {
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(`http://localhost:${port}/api/test`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: '{"broken":',
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { error: "Invalid JSON" });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("oversized JSON returns a JSON 413", async () => {
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(`http://localhost:${port}/api/test`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value: "a".repeat(11 * 1024) }),
        });

        assert.equal(response.status, 413);
        assert.deepEqual(await response.json(), {
            error: "Request body too large",
        });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("CORS does not allow an unconfigured origin", async () => {
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(`http://localhost:${port}/api/health`, {
            headers: {
                Origin: "https://untrusted.example",
            },
        });

        assert.equal(response.status, 200);
        assert.equal(
            response.headers.get("access-control-allow-origin"),
            null,
        );
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});