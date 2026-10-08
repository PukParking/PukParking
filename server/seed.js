import bcrypt from "bcrypt";
import { randomBytes, randomUUID } from "node:crypto";
import database from "./data/db.js";

const buildings = [
    {
        abbreviation: "F1",
        name: "Joon van Rooy Building (F1)",
        description: "Main Administrative Center & Registrar",
        latitude: -26.6882,
        longitude: 27.0929,
    },
    {
        abbreviation: "E7",
        name: "Ferdinand Postma Library (E7)",
        description: "Main Campus Library & Study Commons",
        latitude: -26.689,
        longitude: 27.0918,
    },
    {
        abbreviation: "G3",
        name: "Natural Sciences & IT (G3)",
        description: "Computer Science, Mathematics & Information Technology",
        latitude: -26.6885,
        longitude: 27.0952,
    },
    {
        abbreviation: "F14",
        name: "Student Centre / Drakenstein (F14)",
        description: "Cafeterias, Student Council, & Amenities",
        latitude: -26.6871,
        longitude: 27.0928,
    },
    {
        abbreviation: "F12",
        name: "Sanlam Auditorium (F12)",
        description: "Campus Hall & Event Auditorium",
        latitude: -26.688,
        longitude: 27.0938,
    },
    {
        abbreviation: "N1",
        name: "Faculty of Engineering (N1)",
        description: "Engineering Lecture Halls & Laboratories",
        latitude: -26.682,
        longitude: 27.0942,
    },
];

const parkingAreas = [
    {
        name: "Hoffman St / Main Gate Visitors",
        latitude: -26.6905,
        longitude: 27.0936,
        capacity: 35,
        available: 11,
        type: "visitor",
        restrictions: "Gate 1 (Hoffman Street)",
    },
    {
        name: "Lovers' Lane Student Parking",
        latitude: -26.6878,
        longitude: 27.0945,
        capacity: 120,
        available: 18,
        type: "student",
        restrictions: "Hoffman / Meyer Street Entrances",
    },
    {
        name: "Library & E-Block Parking",
        latitude: -26.6895,
        longitude: 27.0912,
        capacity: 45,
        available: 4,
        type: "staff",
        restrictions: "Borcherd Street Entrance",
    },
    {
        name: "Wasgoedpen Student Parking",
        latitude: -26.6918,
        longitude: 27.095,
        capacity: 160,
        available: 42,
        type: "student",
        restrictions: "Esselen Street Gate",
    },
    {
        name: "G3 Natural Sciences Lot",
        latitude: -26.6889,
        longitude: 27.0962,
        capacity: 50,
        available: 2,
        type: "staff",
        restrictions: "Meyer Street Gate",
    },
    {
        name: "Engineering Complex Parking",
        latitude: -26.6822,
        longitude: 27.0948,
        capacity: 90,
        available: 0,
        type: "student",
        restrictions: "Calderbank Avenue Gate",
    },
];

const seed = database.transaction(() => {
    const buildingsEmpty =
        database.prepare("SELECT COUNT(*) AS count FROM BUILDING").get().count === 0;
    const parkingAreasEmpty =
        database.prepare("SELECT COUNT(*) AS count FROM PARKING_AREA").get().count === 0;

    if (!buildingsEmpty && !parkingAreasEmpty) {
        return { buildings: 0, parkingAreas: 0 };
    }

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
                    Administrator_Username,
                    Administrator_passwordHash,
                    Administrator_Permissions
                ) VALUES (?, ?, ?, NULL)
            `)
            .run(
                administrator.Administrator_ID,
                "parking-seed-owner",
                passwordHash,
            );
    }

    if (buildingsEmpty) {
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
    }

    if (parkingAreasEmpty) {
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
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
                area.capacity - area.available,
                area.restrictions,
            );
        }
    }

    return {
        buildings: buildingsEmpty ? buildings.length : 0,
        parkingAreas: parkingAreasEmpty ? parkingAreas.length : 0,
    };
});

const seeded = seed();
if (seeded.buildings || seeded.parkingAreas) {
    console.log(
        `Seeded ${seeded.buildings} buildings and ${seeded.parkingAreas} parking areas.`,
    );
} else {
    console.log("BUILDING and PARKING_AREA already contain data; seed skipped.");
}

database.close();
