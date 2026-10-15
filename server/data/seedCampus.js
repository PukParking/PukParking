import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import {
    normalizeAdministratorEmail,
} from "../src/admin/provisionFirstAdministrator.js";
import { hashPassword } from "../src/auth/password.js";

export function getBootstrapAdministratorCredentials(environment = process.env) {
    const email = environment.BOOTSTRAP_ADMIN_EMAIL;
    const password = environment.BOOTSTRAP_ADMIN_PASSWORD;

    if (Boolean(email) !== Boolean(password)) {
        throw new Error(
            "Set both BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD.",
        );
    }

    return email ? { email, password } : undefined;
}

const campusFeatures = JSON.parse(
    readFileSync(new URL("../../client/src/data/campusFeatures.json", import.meta.url), "utf8"),
).features;

const parkingAccessTypes = new Map([
    ["Villagers parking", "student"],
    ["Ratau parking", "student"],
    ["Bridge parking", "student"],
    ["Veritas entrance parking", "student"],
    ["Engineering campus parking", "student"],
    ["G5 Parking", "staff"],
    ["Science building parking", "staff"],
    ["E9 Parking", "staff"],
    ["Protection services parking", "staff"],
    ["Main entrance parking", "visitor"],
    ["NWU Astro parking", "visitor"],
]);

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

        const type = parkingAccessTypes.get(feature.properties.name);
        if (!type) {
            throw new Error(
                `Parking feature "${feature.properties.name}" has no configured access type.`,
            );
        }

        return {
            name: feature.properties.name,
            latitude,
            longitude,
            capacity,
            type,
            restrictions: "Access restrictions are not specified in the campus dataset.",
        };
    });

export async function seedCampusData(
    database,
    { onlyIfEmpty = false, administratorCredentials } = {},
) {
    const seedIfEmpty = () => (
        database.prepare("SELECT COUNT(*) AS count FROM BUILDING").get().count === 0 &&
        database.prepare("SELECT COUNT(*) AS count FROM PARKING_AREA").get().count === 0
    );
    if (onlyIfEmpty && !seedIfEmpty()) {
        return null;
    }

    const existingAdministrator = database
        .prepare("SELECT Administrator_ID FROM ADMINISTRATOR ORDER BY Administrator_ID LIMIT 1")
        .get();
    let bootstrapAdministrator = null;

    if (!existingAdministrator) {
        if (!administratorCredentials) {
            throw new Error(
                "Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD to initialize the database.",
            );
        }

        bootstrapAdministrator = {
            email: normalizeAdministratorEmail(administratorCredentials.email),
            passwordHash: await hashPassword(administratorCredentials.password),
        };
    }
    const seed = database.transaction(() => {
        if (onlyIfEmpty && !seedIfEmpty()) {
            return null;
        }

        let administrator = database
            .prepare("SELECT Administrator_ID FROM ADMINISTRATOR ORDER BY Administrator_ID LIMIT 1")
            .get();
        if (!administrator && bootstrapAdministrator) {
            administrator = { Administrator_ID: randomUUID() };
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
                    bootstrapAdministrator.email,
                    bootstrapAdministrator.passwordHash,
                );
        }

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

        database.prepare("DELETE FROM PARKING_FULL_REPORT").run();
        database.prepare("DELETE FROM PARKING_AREA").run();
        database.prepare("DELETE FROM BUILDING").run();

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
            insertBuilding.run(
                randomUUID(),
                administrator.Administrator_ID,
                building.name,
                building.abbreviation,
                building.description,
                building.latitude,
                building.longitude,
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
                Parking_Area_Accessible_Spaces,
                Parking_Area_IsActive
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 0, 1)
        `);

        for (const area of parkingAreas) {
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
        }

        return {
            campusFeatures: campusFeatures.length,
            buildings: buildings.length,
            parkingAreas: parkingAreas.length,
        };
    });

    return seed.immediate();
}
