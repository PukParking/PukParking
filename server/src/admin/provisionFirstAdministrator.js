import { randomUUID } from "node:crypto";
import { hashPassword } from "../auth/password.js";

export function normalizeAdministratorEmail(email) {
    if (typeof email !== "string") {
        throw new TypeError("Administrator email must be a string.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (
        normalizedEmail.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
        throw new TypeError("Enter a valid administrator email address.");
    }

    return normalizedEmail;
}

export class DuplicateAdministratorEmailError extends Error {
    constructor() {
        super("An administrator with this email address already exists.");
        this.name = "DuplicateAdministratorEmailError";
    }
}

export async function provisionFirstAdministrator(database, email, password) {
    const normalizedEmail = normalizeAdministratorEmail(email);
    const passwordHash = await hashPassword(password);

    const insertAdministrator = database.transaction(() => {
        const existingAdministrator = database
            .prepare("SELECT 1 FROM ADMINISTRATOR LIMIT 1")
            .get();

        if (existingAdministrator) {
            throw new Error(
                "An administrator already exists; first-admin setup is disabled.",
            );
        }

        return createAdministratorWithHash(database, normalizedEmail, passwordHash);
    });

    return insertAdministrator();
}

function createAdministratorWithHash(database, normalizedEmail, passwordHash) {
    const id = randomUUID();
    const result = database
        .prepare(`
            INSERT INTO ADMINISTRATOR (
                Administrator_ID,
                Administrator_Email,
                Administrator_passwordHash
            ) VALUES (?, ?, ?)
        `)
        .run(id, normalizedEmail, passwordHash);
    return { ...result, id };
}

export async function provisionAdditionalAdministrator(
    database,
    email,
    password,
) {
    const normalizedEmail = normalizeAdministratorEmail(email);
    const passwordHash = await hashPassword(password);

    const insertAdministrator = database.transaction(() => {
        const existingAdministrator = database
            .prepare(`
                SELECT 1
                FROM ADMINISTRATOR
                WHERE Administrator_Email = ? COLLATE NOCASE
            `)
            .get(normalizedEmail);

        if (existingAdministrator) {
            throw new DuplicateAdministratorEmailError();
        }

        return createAdministratorWithHash(
            database,
            normalizedEmail,
            passwordHash,
        );
    });

    return insertAdministrator();
}
