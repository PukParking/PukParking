import assert from "node:assert/strict";
import Database from "better-sqlite3";
import test from "node:test";

import { migrateParkingAreaSchema } from "./parkingAreaMigration.js";

test("migration adds frontend availability columns to the legacy parking schema", (context) => {
    const database = new Database(":memory:");
    context.after(() => database.close());

    database.exec(`
        CREATE TABLE PARKING_AREA (
            Parking_Area_ID INTEGER PRIMARY KEY,
            Parking_Area_Capacity INTEGER,
            Parking_Area_Occupied_Spaces INTEGER,
            Parking_Type TEXT
        );
        INSERT INTO PARKING_AREA VALUES (1, 60, 25, 'Staff');
        INSERT INTO PARKING_AREA VALUES (2, NULL, NULL, NULL);
    `);

    migrateParkingAreaSchema(database);

    const rows = database
        .prepare("SELECT Total_Bays, Available_Bays, Status, Type FROM PARKING_AREA ORDER BY Parking_Area_ID")
        .all();

    assert.deepEqual(rows, [
        { Total_Bays: 60, Available_Bays: 35, Status: "open", Type: "staff" },
        { Total_Bays: 50, Available_Bays: 10, Status: "open", Type: "student" },
    ]);
});
