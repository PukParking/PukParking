import "dotenv/config";
import database from "../data/db.js";
import {
    getBootstrapAdministratorCredentials,
    seedCampusData,
} from "../data/seedCampus.js";
import { createApp } from "./app.js";

const port = Number(process.env.PORT || 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid port number between 1 and 65535.");
}

if (
    !process.env.JWT_SECRET ||
    Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32
) {
    throw new Error("JWT_SECRET must be set to a secret of at least 32 bytes.");
}

const seeded = await seedCampusData(database, {
    onlyIfEmpty: true,
    administratorCredentials: getBootstrapAdministratorCredentials(),
});
if (seeded) {
    console.log(
        `Empty campus database seeded: ${seeded.buildings} buildings and ` +
        `${seeded.parkingAreas} parking areas added.`,
    );
}

const app = createApp({
    database,
    jwtSecret: process.env.JWT_SECRET,
});

app.listen(port, () => {
    console.log(`PukParking API listening on port ${port}`);
});
