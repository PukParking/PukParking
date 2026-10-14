import bcrypt from "bcrypt";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import database from "./data/db.js";

const campusFeatures = JSON.parse(
    readFileSync(new URL("../client/src/data/campusFeatures.json", import.meta.url), "utf8"),
).features;

function getCampusFeatureId(feature) {
    const slug = feature.properties.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    return `${feature.properties.type}-${slug}`;
}

function getFeatureCoordinates(feature) {
    if (feature.geometry.type === "Point") {
        return feature.geometry.coordinates;
    }

    const ring = feature.geometry.coordinates[0];
    let twiceArea = 0;
    let longitudeTotal = 0;
    let latitudeTotal = 0;

    for (let index = 0; index < ring.length - 1; index += 1) {
        const [longitude, latitude] = ring[index];
        const [nextLongitude, nextLatitude] = ring[index + 1];
        const cross = longitude * nextLatitude - nextLongitude * latitude;
        twiceArea += cross;
        longitudeTotal += (longitude + nextLongitude) * cross;
        latitudeTotal += (latitude + nextLatitude) * cross;
    }

    if (twiceArea === 0) {
        throw new Error(`Parking polygon "${feature.properties.name}" has no area.`);
    }

    return [
        longitudeTotal / (3 * twiceArea),
        latitudeTotal / (3 * twiceArea),
    ];
}

const buildings = campusFeatures
    .filter((feature) => feature.properties.type === "building")
    .map((feature) => {
        const [longitude, latitude] = getFeatureCoordinates(feature);
        return {
            abbreviation: feature.properties.code || feature.properties.name,
            name: feature.properties.name,
            description: "",
            latitude,
            longitude,
        };
    });

const parkingAreas = campusFeatures
    .filter((feature) => feature.properties.type === "parking")
    .map((feature) => {
        const [longitude, latitude] = getFeatureCoordinates(feature);
        const capacity = Number(feature.properties.capacity);
        if (!Number.isInteger(capacity) || capacity <= 0) {
            throw new Error(`Parking feature "${feature.properties.name}" has invalid capacity.`);
        }

        return {
            name: feature.properties.name,
            latitude,
            longitude,
            capacity,
            type: "visitor",
            restrictions: "Access restrictions are not specified in the campus dataset.",
        };
    });

const seed = database.transaction(() => {
    const insertCampusFeature = database.prepare(`
        INSERT INTO CAMPUS_FEATURE (
            Campus_Feature_ID,
            Campus_Feature_Name,
            Campus_Feature_Type,
            Campus_Feature_Code,
            Campus_Feature_Capacity,
            Campus_Feature_GeoJSON
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(Campus_Feature_ID) DO UPDATE SET
            Campus_Feature_Name = excluded.Campus_Feature_Name,
            Campus_Feature_Type = excluded.Campus_Feature_Type,
            Campus_Feature_Code = excluded.Campus_Feature_Code,
            Campus_Feature_Capacity = excluded.Campus_Feature_Capacity,
            Campus_Feature_GeoJSON = excluded.Campus_Feature_GeoJSON
    `);

    for (const feature of campusFeatures) {
        insertCampusFeature.run(
            getCampusFeatureId(feature),
            feature.properties.name,
            feature.properties.type,
            feature.properties.code ?? null,
            feature.properties.capacity ?? null,
            JSON.stringify(feature),
        );
    }

    const featureIds = campusFeatures.map(getCampusFeatureId);
    database
        .prepare(`
            DELETE FROM CAMPUS_FEATURE
            WHERE Campus_Feature_ID NOT IN (${featureIds.map(() => "?").join(", ")})
        `)
        .run(...featureIds);

    let administrator = database
        .prepare("SELECT Administrator_ID FROM ADMINISTRATOR ORDER BY Administrator_ID LIMIT 1")
        .get();

    if (!administrator) {
        const passwordHash = bcrypt.hashSync(randomBytes(32).toString("hex"), 12);
        administrator = {
            Administrator_ID: randomUUID(),
        };
        database
            .prepare(`
                INSERT INTO ADMINISTRATOR (
                    Administrator_ID,
                    Administrator_Email,
                    Administrator_passwordHash,
                    Administrator_Permissions
                ) VALUES (?, ?, ?, NULL)
            `)
            .run(
                administrator.Administrator_ID,
                `seed-owner-${administrator.Administrator_ID.slice(0, 8)}@example.invalid`,
                passwordHash,
            );
    }

    const findBuilding = database.prepare(`
        SELECT Building_ID
        FROM BUILDING
        WHERE Administrator_ID = ? AND Building_Abbreviation = ?
        LIMIT 1
    `);
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
    const updateBuilding = database.prepare(`
        UPDATE BUILDING
        SET Building_Name = ?,
            Building_Description = COALESCE(NULLIF(?, ''), Building_Description),
            Building_Latitude = ?,
            Building_Longitude = ?
        WHERE Building_ID = ?
    `);
    let insertedBuildings = 0;
    let updatedBuildings = 0;

    for (const building of buildings) {
        const existing = findBuilding.get(
            administrator.Administrator_ID,
            building.abbreviation,
        );
        if (existing) {
            updateBuilding.run(
                building.name,
                building.description,
                building.latitude,
                building.longitude,
                existing.Building_ID,
            );
            updatedBuildings += 1;
        } else {
            insertBuilding.run(
                randomUUID(),
                administrator.Administrator_ID,
                building.name,
                building.abbreviation,
                building.description,
                building.latitude,
                building.longitude,
            );
            insertedBuildings += 1;
        }
    }

    const findParkingArea = database.prepare(`
        SELECT Parking_Area_ID
        FROM PARKING_AREA
        WHERE Administrator_ID = ? AND Parking_Area_Name = ?
        LIMIT 1
    `);
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
            Parking_Area_Accessible_Spaces,
            Parking_Area_IsActive
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 0, 1)
    `);
    const updateParkingArea = database.prepare(`
        UPDATE PARKING_AREA
        SET Parking_Area_Latitude = ?,
            Parking_Area_Longitude = ?,
            Parking_Type = ?,
            Parking_Area_Capacity = ?,
            Parking_Area_Occupied_Spaces = MIN(Parking_Area_Occupied_Spaces, ?),
            Parking_Area_Restrictions = ?,
            Parking_Area_IsActive = 1
        WHERE Parking_Area_ID = ?
    `);
    let insertedParkingAreas = 0;
    let updatedParkingAreas = 0;

    for (const area of parkingAreas) {
        const existing = findParkingArea.get(
            administrator.Administrator_ID,
            area.name,
        );
        if (existing) {
            updateParkingArea.run(
                area.latitude,
                area.longitude,
                area.type,
                area.capacity,
                area.capacity,
                area.restrictions,
                existing.Parking_Area_ID,
            );
            updatedParkingAreas += 1;
        } else {
            insertParkingArea.run(
                randomUUID(),
                administrator.Administrator_ID,
                area.name,
                area.latitude,
                area.longitude,
                area.type,
                area.capacity,
                area.restrictions,
            );
            insertedParkingAreas += 1;
        }
    }

    return {
        campusFeatures: campusFeatures.length,
        insertedBuildings,
        updatedBuildings,
        insertedParkingAreas,
        updatedParkingAreas,
    };
});

const seeded = seed();
console.log(
    `Campus dataset synchronized: ${seeded.campusFeatures} GeoJSON features stored; ` +
    `${seeded.insertedBuildings} buildings inserted, ` +
    `${seeded.updatedBuildings} updated; ${seeded.insertedParkingAreas} parking areas inserted, ` +
    `${seeded.updatedParkingAreas} updated.`,
);

database.close();
