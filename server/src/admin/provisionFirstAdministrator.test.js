import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

import {
    hashPassword,
    verifyPassword,
} from "../auth/password.js";
import {
    provisionAdditionalAdministrator,
    provisionFirstAdministrator,
} from "./provisionFirstAdministrator.js";
import { initializeDatabase } from "../../data/initialize.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(
    currentDirectory,
    "../../data/table structure.sql",
);

function createTestDatabase(schemaOverride) {
    const database = new Database(":memory:");
    const schema =
        schemaOverride ?? readFileSync(schemaPath, "utf8");
    initializeDatabase(database, schema);
    return database;
}

test("first administrator email is normalized and password is stored as a hash", async () => {
    const database = createTestDatabase();
    const password = "correct horse battery staple";

    try {
        const result = await provisionFirstAdministrator(
            database,
            "  Admin@Example.com ",
            password,
        );
        const administrator = database
            .prepare("SELECT * FROM ADMINISTRATOR WHERE Administrator_ID = ?")
            .get(result.id);

        assert.equal(administrator.Administrator_Email, "admin@example.com");
        assert.notEqual(administrator.Administrator_passwordHash, password);
        assert.equal(
            await verifyPassword(
                password,
                administrator.Administrator_passwordHash,
            ),
            true,
        );
        assert.equal(administrator.Administrator_Permissions, null);
    } finally {
        database.close();
    }
});

test("first-admin provisioning refuses to create a second administrator", async () => {
    const database = createTestDatabase();

    try {
        await provisionFirstAdministrator(
            database,
            "admin@example.com",
            "correct horse battery staple",
        );

        await assert.rejects(
            provisionFirstAdministrator(
                database,
                "another@example.com",
                "another correct horse battery staple",
            ),
            /first-admin setup is disabled/,
        );
        assert.equal(
            database.prepare("SELECT COUNT(*) AS count FROM ADMINISTRATOR").get()
                .count,
            1,
        );
    } finally {
        database.close();
    }
});

test("first-admin provisioning rejects invalid email addresses", async () => {
    const database = createTestDatabase();

    try {
        await assert.rejects(
            provisionFirstAdministrator(
                database,
                "not-an-email",
                "correct horse battery staple",
            ),
            /valid administrator email/,
        );
        assert.equal(
            database.prepare("SELECT COUNT(*) AS count FROM ADMINISTRATOR").get()
                .count,
            0,
        );
    } finally {
        database.close();
    }
});

test("additional administrator provisioning adds a hashed-password account", async () => {
    const database = createTestDatabase();

    try {
        await provisionFirstAdministrator(
            database,
            "first@example.com",
            "first correct horse battery",
        );
        const result = await provisionAdditionalAdministrator(
            database,
            "  second@example.com ",
            "second correct horse battery",
        );
        const administrator = database
            .prepare("SELECT * FROM ADMINISTRATOR WHERE Administrator_ID = ?")
            .get(result.id);

        assert.equal(administrator.Administrator_Email, "second@example.com");
        assert.equal(
            await verifyPassword(
                "second correct horse battery",
                administrator.Administrator_passwordHash,
            ),
            true,
        );
        assert.equal(
            database.prepare("SELECT COUNT(*) AS count FROM ADMINISTRATOR").get()
                .count,
            2,
        );
    } finally {
        database.close();
    }
});

test("additional administrator provisioning rejects duplicate emails case-insensitively", async () => {
    const database = createTestDatabase();

    try {
        await provisionFirstAdministrator(
            database,
            "admin@example.com",
            "correct horse battery staple",
        );

        await assert.rejects(
            provisionAdditionalAdministrator(
                database,
                "ADMIN@example.com",
                "another correct horse battery",
            ),
            /email address already exists/,
        );
        assert.equal(
            database.prepare("SELECT COUNT(*) AS count FROM ADMINISTRATOR").get()
                .count,
            1,
        );
    } finally {
        database.close();
    }
});

test("database initialization migrates the old username column and enforces unique emails", async () => {
    const legacySchema = `
        CREATE TABLE ADMINISTRATOR (
            Administrator_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Administrator_Username TEXT NOT NULL,
            Administrator_passwordHash TEXT NOT NULL,
            Administrator_Permissions TEXT
        );
    `;
    const database = new Database(":memory:");

    try {
        database.exec(legacySchema);
        const passwordHash = await hashPassword(
            "correct horse battery staple",
        );
        database
            .prepare(`
                INSERT INTO ADMINISTRATOR (
                    Administrator_Username,
                    Administrator_passwordHash
                ) VALUES (?, ?)
            `)
            .run("admin@example.com", passwordHash);

        initializeDatabase(database, readFileSync(schemaPath, "utf8"));

        const migratedAdministrator = database
            .prepare("SELECT * FROM ADMINISTRATOR")
            .get();
        assert.equal(
            migratedAdministrator.Administrator_Email,
            "admin@example.com",
        );
        assert.equal(
            "Administrator_Username" in migratedAdministrator,
            false,
        );
        assert.throws(
            () =>
                database
                    .prepare(`
                        INSERT INTO ADMINISTRATOR (
                            Administrator_ID,
                            Administrator_Email,
                            Administrator_passwordHash
                        ) VALUES (?, ?, ?)
                    `)
                    .run(randomUUID(), "ADMIN@example.com", passwordHash),
            /UNIQUE constraint failed/,
        );
    } finally {
        database.close();
    }
});
