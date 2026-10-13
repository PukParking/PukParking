import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeDatabase } from "./initialize.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(currentDirectory, "table structure.sql");

const legacySchema = `
    PRAGMA foreign_keys = ON;

    CREATE TABLE ADMINISTRATOR (
        Administrator_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Administrator_Email TEXT NOT NULL,
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
        Building_Longitude REAL,
        FOREIGN KEY (Administrator_ID)
            REFERENCES ADMINISTRATOR(Administrator_ID)
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
        FOREIGN KEY (Administrator_ID)
            REFERENCES ADMINISTRATOR(Administrator_ID)
    );

    CREATE TABLE PARKING_FULL_REPORT (
        Report_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Parking_Area_ID INTEGER NOT NULL,
        Report_Submitted_Time TEXT,
        Report_Expiry_Time TEXT,
        FOREIGN KEY (Parking_Area_ID)
            REFERENCES PARKING_AREA(Parking_Area_ID)
    );
`;

test("database migration preserves existing parking rows and adds the building relationship", () => {
    const database = new Database(":memory:");

    try {
        database.exec(legacySchema);
        database.exec(`
            INSERT INTO ADMINISTRATOR (
                Administrator_Email,
                Administrator_passwordHash
            ) VALUES ('admin@example.com', 'test-hash');
            INSERT INTO BUILDING (
                Administrator_ID,
                Building_Name,
                Building_Abbreviation
            ) VALUES (1, 'Library', 'LIB');
            INSERT INTO PARKING_AREA (
                Administrator_ID,
                Parking_Area_Name,
                Parking_Type
            ) VALUES (1, 'Existing Lot', 'Student');
        `);

        initializeDatabase(database, readFileSync(schemaPath, "utf8"));

        const migratedArea = database
            .prepare("SELECT * FROM PARKING_AREA WHERE Parking_Area_Name = ?")
            .get("Existing Lot");
        assert.equal(migratedArea.Parking_Area_Name, "Existing Lot");
        assert.equal(migratedArea.Building_ID, null);
        assert.equal(
            database
                .prepare("SELECT Administrator_SessionVersion FROM ADMINISTRATOR")
                .get().Administrator_SessionVersion,
            0,
        );

        assert.throws(
            () =>
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
                    .run(randomUUID(), randomUUID(), "Invalid FK", "BAD", 0, 0),
            /FOREIGN KEY constraint failed/,
        );
    } finally {
        database.close();
    }
});

test("adding administrator session versions preserves canonical administrator IDs", () => {
    const database = new Database(":memory:");
    const currentSchema = readFileSync(schemaPath, "utf8");
    const previousSchema = currentSchema.replace(
        ",\n    Administrator_SessionVersion INTEGER NOT NULL DEFAULT 0",
        "",
    );
    const administratorId = randomUUID();

    try {
        database.exec(previousSchema);
        database
            .prepare(`
                INSERT INTO ADMINISTRATOR (
                    Administrator_ID,
                    Administrator_Email,
                    Administrator_passwordHash
                ) VALUES (?, ?, ?)
            `)
            .run(administratorId, "existing@example.com", "stored-hash");

        initializeDatabase(database, currentSchema);

        const administrator = database
            .prepare(`
                SELECT Administrator_ID, Administrator_SessionVersion
                FROM ADMINISTRATOR
            `)
            .get();
        assert.deepEqual(administrator, {
            Administrator_ID: administratorId,
            Administrator_SessionVersion: 0,
        });
    } finally {
        database.close();
    }
});
