export function initializeDatabase(database, schema) {
    database.pragma("foreign_keys = ON");
    database.exec(schema);

    const administratorColumns = database
        .prepare("PRAGMA table_info(ADMINISTRATOR)")
        .all()
        .map((column) => column.name);

    if (
        administratorColumns.includes("Administrator_Username") &&
        !administratorColumns.includes("Administrator_Email")
    ) {
        database.exec(
            "ALTER TABLE ADMINISTRATOR RENAME COLUMN Administrator_Username TO Administrator_Email",
        );
    } else if (!administratorColumns.includes("Administrator_Email")) {
        throw new Error(
            "ADMINISTRATOR table must contain an email column or the legacy username column.",
        );
    }

    const parkingAreaColumns = database
        .prepare("PRAGMA table_info(PARKING_AREA)")
        .all()
        .map((column) => column.name);

    if (!parkingAreaColumns.includes("Building_ID")) {
        database.exec(`
            ALTER TABLE PARKING_AREA
            ADD COLUMN Building_ID INTEGER REFERENCES BUILDING(Building_ID)
        `);
    }

    database.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS
            idx_administrator_email_nocase
        ON ADMINISTRATOR (Administrator_Email COLLATE NOCASE)
    `);
}
