import { randomUUID } from "node:crypto";

const canonicalColumns = {
    ADMINISTRATOR: [
        "Administrator_ID",
        "Administrator_Username",
        "Administrator_passwordHash",
        "Administrator_Permissions",
    ],
    BUILDING: [
        "Building_ID",
        "Administrator_ID",
        "Building_Name",
        "Building_Abbreviation",
        "Building_Description",
        "Building_Latitude",
        "Building_Longitude",
    ],
    PARKING_AREA: [
        "Parking_Area_ID",
        "Administrator_ID",
        "Parking_Area_Name",
        "Parking_Area_Latitude",
        "Parking_Area_Longitude",
        "Parking_Type",
        "Parking_Area_Capacity",
        "Parking_Area_Occupied_Spaces",
        "Parking_Area_Restrictions",
        "Parking_Area_Operating_Hours",
        "Parking_Area_Accessible_Spaces",
        "Parking_Area_Image_URL",
        "Parking_Area_IsActive",
    ],
    PARKING_FULL_REPORT: [
        "Report_ID",
        "Parking_Area_ID",
        "Report_Submitted_Time",
        "Report_Expiry_Time",
    ],
};

function readTable(database, table) {
    return database.prepare(`SELECT * FROM ${table}`).all();
}

function hasCanonicalSchema(database) {
    return Object.entries(canonicalColumns).every(([table, columns]) => {
        const info = database.prepare(`PRAGMA table_info(${table})`).all();
        const names = info.map((column) => column.name);
        const idColumn = info.find((column) => column.pk === 1);
        const foreignKeyTypes = info
            .filter((column) => column.name.endsWith("_ID"))
            .every((column) => column.type.toUpperCase() === "TEXT");

        return (
            columns.every((column) => names.includes(column)) &&
            names.length === columns.length &&
            idColumn?.type.toUpperCase() === "TEXT" &&
            idColumn.notnull === 1 &&
            foreignKeyTypes
        );
    });
}

function normalizeParkingType(value) {
    const type = String(value ?? "").toLowerCase();
    return type === "guest" ? "visitor" : ["student", "staff", "visitor"].includes(type) ? type : "student";
}

export function migrateErdSchema(database, schemaSql) {
    if (hasCanonicalSchema(database)) {
        return false;
    }

    const administrators = readTable(database, "ADMINISTRATOR");
    const buildings = readTable(database, "BUILDING");
    const parkingAreas = readTable(database, "PARKING_AREA");
    const reports = readTable(database, "PARKING_FULL_REPORT");
    const administratorIds = new Map(
        administrators.map((administrator) => [
            String(administrator.Administrator_ID),
            randomUUID(),
        ]),
    );
    const buildingIds = new Map(
        buildings.map((building) => [String(building.Building_ID), randomUUID()]),
    );
    const parkingAreaIds = new Map(
        parkingAreas.map((area) => [String(area.Parking_Area_ID), randomUUID()]),
    );
    const reportIds = new Map(
        reports.map((report) => [String(report.Report_ID), randomUUID()]),
    );

    database.pragma("foreign_keys = OFF");

    try {
        const migrate = database.transaction(() => {
            database.exec(`
                DROP TABLE IF EXISTS PARKING_FULL_REPORT;
                DROP TABLE IF EXISTS PARKING_AREA;
                DROP TABLE IF EXISTS BUILDING;
                DROP TABLE IF EXISTS ADMINISTRATOR;
                ${schemaSql}
            `);

            const insertAdministrator = database.prepare(`
                INSERT INTO ADMINISTRATOR (
                    Administrator_ID,
                    Administrator_Username,
                    Administrator_passwordHash,
                    Administrator_Permissions
                ) VALUES (?, ?, ?, ?)
            `);
            for (const administrator of administrators) {
                insertAdministrator.run(
                    administratorIds.get(String(administrator.Administrator_ID)),
                    administrator.Administrator_Username ?? "Migrated administrator",
                    administrator.Administrator_passwordHash ?? "",
                    administrator.Administrator_Permissions ?? null,
                );
            }

            const insertBuilding = database.prepare(`
                INSERT INTO BUILDING (
                    Building_ID,
                    Administrator_ID,
                    Building_Name,
                    Building_Abbreviation,
                    Building_Description,
                    Building_Latitude,
                    Building_Longitude
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            for (const building of buildings) {
                const administratorId = administratorIds.get(
                    String(building.Administrator_ID),
                );
                if (!administratorId) {
                    throw new Error(
                        `Building ${building.Building_ID} references a missing administrator.`,
                    );
                }
                insertBuilding.run(
                    buildingIds.get(String(building.Building_ID)),
                    administratorId,
                    building.Building_Name ?? "Unnamed building",
                    building.Building_Abbreviation ?? "N/A",
                    building.Building_Description ?? null,
                    Number.isFinite(Number(building.Building_Latitude))
                        ? Number(building.Building_Latitude)
                        : 0,
                    Number.isFinite(Number(building.Building_Longitude))
                        ? Number(building.Building_Longitude)
                        : 0,
                );
            }

            const insertParkingArea = database.prepare(`
                INSERT INTO PARKING_AREA (
                    Parking_Area_ID,
                    Administrator_ID,
                    Parking_Area_Name,
                    Parking_Area_Latitude,
                    Parking_Area_Longitude,
                    Parking_Type,
                    Parking_Area_Capacity,
                    Parking_Area_Occupied_Spaces,
                    Parking_Area_Restrictions,
                    Parking_Area_Operating_Hours,
                    Parking_Area_Accessible_Spaces,
                    Parking_Area_Image_URL,
                    Parking_Area_IsActive
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const area of parkingAreas) {
                const administratorId = administratorIds.get(
                    String(area.Administrator_ID),
                );
                if (!administratorId) {
                    throw new Error(
                        `Parking area ${area.Parking_Area_ID} references a missing administrator.`,
                    );
                }

                const capacity = Math.max(
                    0,
                    Number(
                        area.Parking_Area_Capacity ??
                            area.Total_Bays ??
                            area.capacity ??
                            50,
                    ),
                );
                const previousAvailable = Number(area.Available_Bays);
                const previousOccupied = Number(area.Parking_Area_Occupied_Spaces);
                const occupied = Math.max(
                    0,
                    Math.min(
                        capacity,
                        Number.isFinite(previousOccupied)
                            ? previousOccupied
                            : Number.isFinite(previousAvailable)
                              ? capacity - previousAvailable
                              : 0,
                    ),
                );

                insertParkingArea.run(
                    parkingAreaIds.get(String(area.Parking_Area_ID)),
                    administratorId,
                    area.Parking_Area_Name ?? "Unnamed parking area",
                    Number.isFinite(Number(area.Parking_Area_Latitude))
                        ? Number(area.Parking_Area_Latitude)
                        : 0,
                    Number.isFinite(Number(area.Parking_Area_Longitude))
                        ? Number(area.Parking_Area_Longitude)
                        : 0,
                    normalizeParkingType(area.Parking_Type ?? area.Type),
                    capacity,
                    occupied,
                    area.Parking_Area_Restrictions ?? null,
                    area.Parking_Area_Operating_Hours ?? null,
                    Math.max(0, Number(area.Parking_Area_Accessible_Spaces ?? 0)),
                    area.Parking_Area_Image_URL ?? null,
                    Number(area.Parking_Area_IsActive ?? area.Parking_Area_isActive ?? 1)
                        ? 1
                        : 0,
                );
            }

            const insertReport = database.prepare(`
                INSERT INTO PARKING_FULL_REPORT (
                    Report_ID,
                    Parking_Area_ID,
                    Report_Submitted_Time,
                    Report_Expiry_Time
                ) VALUES (?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?)
            `);
            for (const report of reports) {
                const parkingAreaId = parkingAreaIds.get(
                    String(report.Parking_Area_ID),
                );
                if (!parkingAreaId) {
                    throw new Error(
                        `Full report ${report.Report_ID} references a missing parking area.`,
                    );
                }
                insertReport.run(
                    reportIds.get(String(report.Report_ID)),
                    parkingAreaId,
                    report.Report_Submitted_Time ?? null,
                    report.Report_Expiry_Time ?? new Date().toISOString(),
                );
            }
        });

        migrate();
        const violations = database.pragma("foreign_key_check");
        if (violations.length > 0) {
            throw new Error("SQLite ERD migration created invalid foreign-key references.");
        }
        return true;
    } finally {
        database.pragma("foreign_keys = ON");
    }
}
