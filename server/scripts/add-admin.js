import { stdout } from "node:process";
import database from "../data/db.js";
import { provisionAdditionalAdministrator } from "../src/admin/provisionFirstAdministrator.js";
import { promptForAdministratorCredentials } from "./administratorPrompts.js";

async function main() {
    const { email, password } = await promptForAdministratorCredentials();
    const result = await provisionAdditionalAdministrator(
        database,
        email,
        password,
    );

    stdout.write(
        `Created administrator account (ID ${result.lastInsertRowid}).\n`,
    );
}

main()
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => {
        database.close();
    });
