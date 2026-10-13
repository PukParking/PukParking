import { stdout } from "node:process";
import database from "../data/db.js";
import {
    DuplicateAdministratorEmailError,
    provisionAdditionalAdministrator,
} from "../src/admin/provisionFirstAdministrator.js";
import { promptForAdministratorCredentials } from "./administratorPrompts.js";

async function main() {
    while (true) {
        const { email, password } = await promptForAdministratorCredentials();

        try {
            const result = await provisionAdditionalAdministrator(
                database,
                email,
                password,
            );
            stdout.write(
                `Created administrator account (ID ${result.lastInsertRowid}).\n`,
            );
            return;
        } catch (error) {
            if (!(error instanceof DuplicateAdministratorEmailError)) {
                throw error;
            }
            console.error(error.message);
        }
    }
}

main()
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => {
        database.close();
    });
