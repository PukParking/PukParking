export function migrateParkingAreaSchema(database) {
    const migrate = database.transaction(() => {
        const parkingColumns = new Set(
            database
                .prepare("PRAGMA table_info(PARKING_AREA)")
                .all()
                .map((column) => column.name),
        );
        const compatibilityColumns = {
            Total_Bays: "INTEGER NOT NULL DEFAULT 50",
            Available_Bays: "INTEGER NOT NULL DEFAULT 10",
            Status: "TEXT NOT NULL DEFAULT 'open'",
            Type: "TEXT NOT NULL DEFAULT 'student'",
        };
        const addedColumns = new Set();

        for (const [column, definition] of Object.entries(compatibilityColumns)) {
            if (!parkingColumns.has(column)) {
                database.exec(`ALTER TABLE PARKING_AREA ADD COLUMN ${column} ${definition}`);
                addedColumns.add(column);
            }
        }

        if (addedColumns.has("Total_Bays")) {
            database.exec(`
                UPDATE PARKING_AREA
                SET Total_Bays = COALESCE(Parking_Area_Capacity, 50)
            `);
        }

        if (addedColumns.has("Available_Bays")) {
            database.exec(`
                UPDATE PARKING_AREA
                SET Available_Bays = MAX(
                    0,
                    COALESCE(Parking_Area_Capacity, 50) -
                        COALESCE(
                            Parking_Area_Occupied_Spaces,
                            COALESCE(Parking_Area_Capacity, 50) - 10
                        )
                )
            `);
        }

        if (addedColumns.has("Type")) {
            database.exec(`
                UPDATE PARKING_AREA
                SET Type = LOWER(COALESCE(NULLIF(Parking_Type, ''), 'student'))
            `);
        }

        if (addedColumns.has("Status")) {
            database.exec(`
                UPDATE PARKING_AREA
                SET Status = CASE
                    WHEN Available_Bays <= 0 THEN 'full'
                    WHEN Available_Bays < MAX(Total_Bays * 0.2, 5) THEN 'almost_full'
                    ELSE 'open'
                END
            `);
        }
    });
    migrate();
}
