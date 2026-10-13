import { migrateErdSchema } from "./erdSchemaMigration.js";

export function initializeDatabase(database, schema) {
    database.exec(schema);

    const existingAdministratorColumns = database
        .prepare("PRAGMA table_info(ADMINISTRATOR)")
        .all()
        .map((column) => column.name);
    if (!existingAdministratorColumns.includes("Administrator_SessionVersion")) {
        database.exec(`
            ALTER TABLE ADMINISTRATOR
            ADD COLUMN Administrator_SessionVersion INTEGER NOT NULL DEFAULT 0
        `);
    }

    migrateErdSchema(database, schema);

    const administratorColumns = database
        .prepare("PRAGMA table_info(ADMINISTRATOR)")
        .all()
        .map((column) => column.name);
    if (!administratorColumns.includes("Administrator_Email")) {
        throw new Error(
            "ADMINISTRATOR table must contain an email column.",
        );
    }

    const parkingAreaColumns = database
        .prepare("PRAGMA table_info(PARKING_AREA)")
        .all()
        .map((column) => column.name);
    if (!parkingAreaColumns.includes("Building_ID")) {
        database.exec(`
            ALTER TABLE PARKING_AREA
            ADD COLUMN Building_ID TEXT REFERENCES BUILDING(Building_ID)
        `);
    }

    database.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS
            idx_administrator_email_nocase
        ON ADMINISTRATOR (Administrator_Email COLLATE NOCASE)
    `);
    database.pragma("foreign_keys = ON");
}
