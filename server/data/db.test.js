import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import test from "node:test";

import { migrateErdSchema } from "./erdSchemaMigration.js";

const schemaSql = readFileSync(new URL("./table structure.sql", import.meta.url), "utf8");

function createLegacyDatabase(database) {
    database.exec(`
        CREATE TABLE ADMINISTRATOR (
            Administrator_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Administrator_Username TEXT NOT NULL,
            Administrator_passwordHash TEXT NOT NULL,
            Administrator_Permissions TEXT
        );
        CREATE TABLE BUILDING (
            Building_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Administrator_ID INTEGER NOT NULL,
            Building_Name TEXT NOT NULL,
            Building_Abbreviation TEXT,
            Building_Description TEXT,
            Building_Latitude REAL,
            Building_Longitude REAL
        );
        CREATE TABLE PARKING_AREA (
            Parking_Area_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Administrator_ID INTEGER NOT NULL,
            Parking_Area_Name TEXT NOT NULL,
            Parking_Area_Latitude REAL,
            Parking_Area_Longitude REAL,
            Parking_Type TEXT,
            Parking_Area_Capacity INTEGER,
            Parking_Area_Occupied_Spaces INTEGER,
            Parking_Area_Restrictions TEXT,
            Parking_Area_Operating_Hours TEXT,
            Parking_Area_Accessible_Spaces INTEGER,
            Parking_Area_Image_URL TEXT,
            Parking_Area_isActive INTEGER,
            Total_Bays INTEGER DEFAULT 50,
            Available_Bays INTEGER DEFAULT 10,
            Status TEXT DEFAULT 'open',
            Type TEXT DEFAULT 'student'
        );
        CREATE TABLE PARKING_FULL_REPORT (
            Report_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Parking_Area_ID INTEGER NOT NULL,
            Report_Submitted_Time TEXT,
            Report_Expiry_Time TEXT
        );
        INSERT INTO ADMINISTRATOR VALUES (1, 'admin', 'stored-hash', NULL);
        INSERT INTO BUILDING VALUES (2, 1, 'Legacy building', 'LB', 'Legacy description', -26.6, 27.1);
        INSERT INTO PARKING_AREA VALUES (
            3, 1, 'Legacy lot', -26.7, 27.2, 'Staff', 60, 25,
            'Legacy gate', 'Always open', 2, NULL, 1, 60, 35, 'open', 'staff'
        );
        INSERT INTO PARKING_FULL_REPORT VALUES (4, 3, '2026-01-01 12:00:00', '2026-01-01 12:30:00');
    `);
}

test("migration converts legacy tables and preserves related data using UUID text IDs", (context) => {
    const database = new Database(":memory:");
    context.after(() => database.close());
    createLegacyDatabase(database);

    assert.equal(migrateErdSchema(database, schemaSql), true);

    const administrator = database.prepare("SELECT * FROM ADMINISTRATOR").get();
    const building = database.prepare("SELECT * FROM BUILDING").get();
    const area = database.prepare("SELECT * FROM PARKING_AREA").get();
    const report = database.prepare("SELECT * FROM PARKING_FULL_REPORT").get();

    assert.match(administrator.Administrator_ID, /^[0-9a-f-]{36}$/i);
    assert.match(building.Building_ID, /^[0-9a-f-]{36}$/i);
    assert.equal(building.Administrator_ID, administrator.Administrator_ID);
    assert.equal(building.Building_Name, "Legacy building");
    assert.match(area.Parking_Area_ID, /^[0-9a-f-]{36}$/i);
    assert.equal(area.Administrator_ID, administrator.Administrator_ID);
    assert.equal(area.Parking_Type, "staff");
    assert.equal(area.Parking_Area_Capacity, 60);
    assert.equal(area.Parking_Area_Occupied_Spaces, 25);
    assert.equal(area.Parking_Area_IsActive, 1);
    assert.match(report.Report_ID, /^[0-9a-f-]{36}$/i);
    assert.equal(report.Parking_Area_ID, area.Parking_Area_ID);
    assert.deepEqual(database.pragma("foreign_key_check"), []);
    assert.equal(database.prepare("PRAGMA table_info(PARKING_AREA)").all().length, 14);
});

test("canonical schema migration is a no-op", (context) => {
    const database = new Database(":memory:");
    context.after(() => database.close());
    database.exec(schemaSql);

    assert.equal(migrateErdSchema(database, schemaSql), false);
});
