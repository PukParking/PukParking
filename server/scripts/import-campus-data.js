// Adds buildings and parking areas from server/data/campus-data.json to an
// existing database. Rows that already exist are skipped, never changed.
// JSON keys are the database column names (BUILDING / PARKING_AREA tables).
// Building_ID, Administrator_ID and Parking_Area_ID are generated here.
//   npm run import-campus            -> import
//   npm run import-campus -- --dry   -> show what would be added, change nothing
//   npm run import-campus -- path/to/other.json
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import database from "../data/db.js";

const PARKING_TYPES = new Set(["Student", "Staff", "Guest"]); // same as the admin API

const args = process.argv.slice(2);
const dryRun = args.includes("--dry");
const fileArg = args.find((arg) => !arg.startsWith("--"));
const dataPath = fileArg
    ? resolve(fileArg)
    : join(dirname(fileURLToPath(import.meta.url)), "../data/campus-data.json");

const { buildings = [], parkingAreas = [] } = JSON.parse(
    readFileSync(dataPath, "utf8"),
);

const admin = database
    .prepare("SELECT Administrator_ID AS id FROM ADMINISTRATOR ORDER BY Administrator_ID LIMIT 1")
    .get();
if (!admin) {
    console.error("No administrator exists yet. Run `npm run add-admin` first.");
    if (result.noType.length) {
    console.log(`Not imported, Parking_Type (Student, Staff or Guest) not set: ${result.noType.join(", ")}`);
}
database.close();
    process.exit(1);
}

const hasCoordinates = (lat, lon) => Number.isFinite(lat) && Number.isFinite(lon);

const run = database.transaction(() => {
    const added = { buildings: 0, parkingAreas: 0 };
    const skipped = [];
    const noCoordinates = [];
    const noType = [];

    // The code (Building_Abbreviation) identifies a building, as on the campus map.
    const codeExists = database.prepare(
        "SELECT 1 FROM BUILDING WHERE Building_Abbreviation = ? COLLATE NOCASE",
    );
    // Names present before this run, so a row that already holds this name
    // under a different code is reported instead of being added twice.
    const existingNames = new Map(
        database
            .prepare("SELECT lower(Building_Name) AS name, Building_Abbreviation AS code FROM BUILDING")
            .all()
            .map((row) => [row.name, row.code]),
    );
    const insertBuilding = database.prepare(`
        INSERT INTO BUILDING (Building_ID, Administrator_ID, Building_Name,
            Building_Abbreviation, Building_Description, Building_Latitude, Building_Longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const b of buildings) {
        if (codeExists.get(b.Building_Abbreviation)) {
            skipped.push(`building ${b.Building_Abbreviation}`);
            continue;
        }
        if (!hasCoordinates(b.Building_Latitude, b.Building_Longitude)) {
            noCoordinates.push(b.Building_Abbreviation);
            continue;
        }
        const sameName = existingNames.get(b.Building_Name.toLowerCase());
        if (sameName) {
            console.warn(`  ! ${b.Building_Abbreviation} "${b.Building_Name}" already exists under code ${sameName}; not added. Correct that row's code.`);
            skipped.push(`building ${b.Building_Abbreviation} (name exists as ${sameName})`);
            continue;
        }
        insertBuilding.run(randomUUID(), admin.id, b.Building_Name,
            b.Building_Abbreviation, b.Building_Description ?? null,
            b.Building_Latitude, b.Building_Longitude);
        added.buildings++;
    }

    const findArea = database.prepare(
        "SELECT 1 FROM PARKING_AREA WHERE Parking_Area_Name = ? COLLATE NOCASE",
    );
    const findBuildingByAbbr = database.prepare(
        "SELECT Building_ID AS id FROM BUILDING WHERE Building_Abbreviation = ? COLLATE NOCASE",
    );
    const insertArea = database.prepare(`
        INSERT INTO PARKING_AREA (Parking_Area_ID, Administrator_ID, Building_ID,
            Parking_Area_Name, Parking_Area_Latitude, Parking_Area_Longitude,
            Parking_Type, Parking_Area_Capacity, Parking_Area_Occupied_Spaces,
            Parking_Area_Restrictions, Parking_Area_Operating_Hours,
            Parking_Area_Accessible_Spaces, Parking_Area_Image_URL, Parking_Area_IsActive)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const a of parkingAreas) {
        if (!hasCoordinates(a.Parking_Area_Latitude, a.Parking_Area_Longitude)) {
            noCoordinates.push(a.Parking_Area_Name);
            continue;
        }
        if (a.Parking_Type == null) {
            noType.push(a.Parking_Area_Name);
            continue;
        }
        if (!PARKING_TYPES.has(a.Parking_Type)) {
            throw new Error(
                `"${a.Parking_Area_Name}": Parking_Type must be Student, Staff or Guest.`,
            );
        }
        if (findArea.get(a.Parking_Area_Name)) {
            skipped.push(`parking area ${a.Parking_Area_Name}`);
            continue;
        }
        let buildingId = null;
        if (a.Building_Abbreviation) {
            buildingId = findBuildingByAbbr.get(a.Building_Abbreviation)?.id ?? null;
            if (!buildingId) {
                console.warn(`  ! "${a.Parking_Area_Name}": building "${a.Building_Abbreviation}" not found, left unassigned.`);
            }
        }
        insertArea.run(randomUUID(), admin.id, buildingId, a.Parking_Area_Name,
            a.Parking_Area_Latitude, a.Parking_Area_Longitude, a.Parking_Type,
            a.Parking_Area_Capacity, a.Parking_Area_Occupied_Spaces ?? 0,
            a.Parking_Area_Restrictions ?? null, a.Parking_Area_Operating_Hours ?? null,
            a.Parking_Area_Accessible_Spaces ?? 0, a.Parking_Area_Image_URL ?? null,
            a.Parking_Area_IsActive ?? 1);
        added.parkingAreas++;
    }

    if (dryRun) throw Object.assign(new Error("dry-run"), { added, skipped, noCoordinates, noType });
    return { added, skipped, noCoordinates, noType };
});

let result;
try {
    result = run();
} catch (error) {
    if (error.message !== "dry-run") throw error;
    result = { added: error.added, skipped: error.skipped, noCoordinates: error.noCoordinates, noType: error.noType };
    console.log("(dry run, nothing was written)");
}
console.log(`Added ${result.added.buildings} buildings and ${result.added.parkingAreas} parking areas.`);
if (result.skipped.length) console.log(`Skipped ${result.skipped.length} already present: ${result.skipped.join(", ")}`);
if (result.noCoordinates.length) {
    console.log(`Not imported, no latitude/longitude yet: ${result.noCoordinates.length} entries.`);
}
if (result.noType.length) {
    console.log(`Not imported, Parking_Type (Student, Staff or Guest) not set: ${result.noType.join(", ")}`);
}
database.close();