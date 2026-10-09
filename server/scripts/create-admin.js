import { stdout } from "node:process";
import database from "../data/db.js";
import { provisionFirstAdministrator } from "../src/admin/provisionFirstAdministrator.js";
import { promptForAdministratorCredentials } from "./administratorPrompts.js";

async function main() {
    const { email, password } = await promptForAdministratorCredentials();

    const result = await provisionFirstAdministrator(
        database,
        email,
        password,
    );

    stdout.write(
        `Created the first administrator account (ID ${result.lastInsertRowid}).\n`,
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
