import { StringDecoder } from "node:string_decoder";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import {
    PasswordPolicyError,
    validatePasswordPolicy,
} from "../src/auth/password.js";
import { normalizeAdministratorEmail } from "../src/admin/provisionFirstAdministrator.js";

async function promptForEmail() {
    while (true) {
        const prompts = readline.createInterface({ input: stdin, output: stdout });
        let email;

        try {
            email = await prompts.question("Administrator email: ");
        } finally {
            prompts.close();
        }

        try {
            return normalizeAdministratorEmail(email);
        } catch (error) {
            if (!(error instanceof TypeError)) {
                throw error;
            }
            stdout.write(`${error.message}\n`);
        }
    }
}

function promptForHiddenPassword(prompt) {
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
        throw new Error(
            "Administrator setup requires an interactive terminal so the password can be entered without echo.",
        );
    }

    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();

    return new Promise((resolve, reject) => {
        const decoder = new StringDecoder("utf8");
        let password = "";

        const cleanup = () => {
            stdin.off("data", onData);
            stdin.off("end", onEnd);
            stdin.setRawMode(false);
            stdin.pause();
            stdout.write("\n");
        };

        const onEnd = () => {
            cleanup();
            reject(new Error("Password entry was interrupted."));
        };

        const onData = (chunk) => {
            for (const character of decoder.write(chunk)) {
                if (character === "\u0003") {
                    cleanup();
                    reject(new Error("Administrator setup cancelled."));
                    return;
                }

                if (character === "\r" || character === "\n") {
                    cleanup();
                    resolve(password);
                    return;
                }

                if (character === "\u007f" || character === "\b") {
                    const characters = Array.from(password);
                    if (characters.length > 0) {
                        characters.pop();
                        password = characters.join("");
                        stdout.write("\b \b");
                    }
                    continue;
                }

                if (character >= " ") {
                    password += character;
                    stdout.write("*");
                }
            }
        };

        stdin.on("data", onData);
        stdin.once("end", onEnd);
    });
}

export async function promptForAdministratorCredentials() {
    if (!stdin.isTTY) {
        throw new Error(
            "Administrator setup must be run in an interactive terminal.",
        );
    }

    const email = await promptForEmail();

    while (true) {
        const password = await promptForHiddenPassword(
            "Administrator password (input hidden): ",
        );

        try {
            validatePasswordPolicy(password);
        } catch (error) {
            if (
                !(error instanceof TypeError) &&
                !(error instanceof PasswordPolicyError)
            ) {
                throw error;
            }
            stdout.write(`${error.message}\n`);
            continue;
        }

        while (true) {
            const confirmation = await promptForHiddenPassword(
                "Confirm password (input hidden): ",
            );

            if (password === confirmation) {
                return { email, password };
            }

            stdout.write("Passwords do not match. Please try again.\n");
        }
    }
}
