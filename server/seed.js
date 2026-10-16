import "dotenv/config";
import database from "./data/db.js";
import {
    getBootstrapAdministratorCredentials,
    seedCampusData,
} from "./data/seedCampus.js";

const seeded = await seedCampusData(database, {
    administratorCredentials: getBootstrapAdministratorCredentials(),
});
console.log(
    `Campus dataset synchronized: ${seeded.campusFeatures} GeoJSON features stored; ` +
    `${seeded.buildings} buildings and ${seeded.parkingAreas} parking areas seeded.`,
);

database.close();
