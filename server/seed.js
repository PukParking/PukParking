import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import database from "./data/db.js";

const parkingAreas = [
    {
        name: "Hoffman St / Main Gate Visitors",
        latitude: -26.6905,
        longitude: 27.0936,
        totalBays: 35,
        availableBays: 11,
        type: "visitor",
    },
    {
        name: "Lovers' Lane Student Parking",
        latitude: -26.6878,
        longitude: 27.0945,
        totalBays: 120,
        availableBays: 18,
        type: "student",
    },
    {
        name: "Library & E-Block Parking",
        latitude: -26.6895,
        longitude: 27.0912,
        totalBays: 45,
        availableBays: 4,
        type: "staff",
    },
    {
        name: "Wasgoedpen Student Parking",
        latitude: -26.6918,
        longitude: 27.095,
        totalBays: 160,
        availableBays: 42,
        type: "student",
    },
    {
        name: "G3 Natural Sciences Lot",
        latitude: -26.6889,
        longitude: 27.0962,
        totalBays: 50,
        availableBays: 2,
        type: "staff",
    },
    {
        name: "Engineering Complex Parking",
        latitude: -26.6822,
        longitude: 27.0948,
        totalBays: 90,
        availableBays: 0,
        type: "student",
    },
];

const seed = database.transaction(() => {
    const count = database.prepare("SELECT COUNT(*) AS count FROM PARKING_AREA").get().count;
    if (count > 0) {
        return false;
    }

    let administrator = database
        .prepare("SELECT Administrator_ID FROM ADMINISTRATOR ORDER BY Administrator_ID LIMIT 1")
        .get();

    if (!administrator) {
        const passwordHash = bcrypt.hashSync(randomBytes(32).toString("hex"), 12);
        const result = database
            .prepare(`
                INSERT INTO ADMINISTRATOR (
                    Administrator_Username,
                    Administrator_passwordHash
                ) VALUES (?, ?)
            `)
            .run("parking-seed-owner", passwordHash);
        administrator = { Administrator_ID: result.lastInsertRowid };
    }

    const insertParkingArea = database.prepare(`
        INSERT INTO PARKING_AREA (
            Administrator_ID,
            Parking_Area_Name,
            Parking_Area_Latitude,
            Parking_Area_Longitude,
            Parking_Type,
            Parking_Area_Capacity,
            Parking_Area_Occupied_Spaces,
            Parking_Area_isActive,
            Total_Bays,
            Available_Bays,
            Status,
            Type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `);

    for (const area of parkingAreas) {
        const status =
            area.availableBays <= 0
                ? "full"
                : area.availableBays < Math.max(area.totalBays * 0.2, 5)
                  ? "almost_full"
                  : "open";

        insertParkingArea.run(
            administrator.Administrator_ID,
            area.name,
            area.latitude,
            area.longitude,
            area.type,
            area.totalBays,
            area.totalBays - area.availableBays,
            area.totalBays,
            area.availableBays,
            status,
            area.type,
        );
    }

    return true;
});

if (seed()) {
    console.log(`Seeded ${parkingAreas.length} NWU Potchefstroom parking areas.`);
} else {
    console.log("PARKING_AREA already contains data; seed skipped.");
}

database.close();
