import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { after, test } from "node:test";
import { initializeDatabase } from "../data/initialize.js";

process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const database = new Database(":memory:");
initializeDatabase(
    database,
    readFileSync(new URL("../data/tableStructure.sql", import.meta.url), "utf8"),
);

const administratorId = randomUUID();
const buildingId = randomUUID();
const parkingAreaId = randomUUID();
database.prepare(`
    INSERT INTO ADMINISTRATOR (
        Administrator_ID,
        Administrator_Email,
        Administrator_passwordHash
    ) VALUES (?, ?, ?)
`).run(administratorId, "test-admin@example.invalid", "test-hash");
database.prepare(`
    INSERT INTO BUILDING (
        Building_ID,
        Administrator_ID,
        Building_Name,
        Building_Abbreviation,
        Building_Latitude,
        Building_Longitude
    ) VALUES (?, ?, ?, ?, ?, ?)
`).run(buildingId, administratorId, "Test Building", "F1", -26.6882, 27.0929);
database.prepare(`
    INSERT INTO PARKING_AREA (
        Parking_Area_ID,
        Administrator_ID,
        Building_ID,
        Parking_Area_Name,
        Parking_Area_Latitude,
        Parking_Area_Longitude,
        Parking_Type,
        Parking_Area_Capacity,
        Parking_Area_Occupied_Spaces
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
    parkingAreaId,
    administratorId,
    buildingId,
    "Hoffman St / Main Gate Visitors",
    -26.6905,
    27.0936,
    "visitor",
    35,
    24,
);

const { createApp } = await import("./app.js");
const app = createApp({
    database,
    jwtSecret: "test-only-secret-with-at-least-32-bytes",
});

after(() => database.close());

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
        assert.equal(parkingAreas.length, 1);
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
        assert.equal(buildings.length, 1);
        assert.equal(
            buildings.some((building) => building.Building_Abbreviation === "F1"),
            true,
        );
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

test("CORS allows any browser origin", async () => {
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
            "https://untrusted.example",
        );
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});