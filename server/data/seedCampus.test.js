import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import Database from "better-sqlite3";
import { verifyPassword } from "../src/auth/password.js";
import { initializeDatabase } from "./initialize.js";
import { seedCampusData } from "./seedCampus.js";

const schema = readFileSync(new URL("./tableStructure.sql", import.meta.url), "utf8");

test("startup seeding creates the configured admin, populates an empty campus, and preserves it later", async () => {
    const database = new Database(":memory:");

    try {
        initializeDatabase(database, schema);

        const seeded = await seedCampusData(database, {
            onlyIfEmpty: true,
            administratorCredentials: {
                email: "test-admin@example.invalid",
                password: "test-bootstrap-password-123",
            },
        });
        assert.ok(seeded);
        assert.ok(seeded.buildings > 0);
        assert.ok(seeded.parkingAreas > 0);
        const administrator = database.prepare(`
            SELECT Administrator_Email, Administrator_passwordHash
            FROM ADMINISTRATOR
        `).get();
        assert.equal(administrator.Administrator_Email, "test-admin@example.invalid");
        assert.equal(
            await verifyPassword(
                "test-bootstrap-password-123",
                administrator.Administrator_passwordHash,
            ),
            true,
        );
        assert.equal(
            database.prepare("SELECT COUNT(*) AS count FROM BUILDING").get().count,
            seeded.buildings,
        );

        database.prepare(`
            UPDATE BUILDING
            SET Building_Name = 'Preserved building'
            WHERE Building_ID = (
                SELECT Building_ID FROM BUILDING LIMIT 1
            )
        `).run();

        assert.equal(
            await seedCampusData(database, {
                onlyIfEmpty: true,
                administratorCredentials: {
                    email: "other-admin@example.invalid",
                    password: "other-bootstrap-password-123",
                },
            }),
            null,
        );
        assert.equal(
            database.prepare(`
                SELECT COUNT(*) AS count
                FROM BUILDING
                WHERE Building_Name = 'Preserved building'
            `).get().count,
            1,
        );
    } finally {
        database.close();
    }
});

test("initialization fails clearly if no admin exists and bootstrap credentials are missing", async () => {
    const database = new Database(":memory:");

    try {
        initializeDatabase(database, schema);

        await assert.rejects(
            seedCampusData(database, { onlyIfEmpty: true }),
            /BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD/,
        );
        assert.equal(
            database.prepare("SELECT COUNT(*) AS count FROM ADMINISTRATOR").get().count,
            0,
        );
    } finally {
        database.close();
    }
});

test("unrelated records and an existing admin do not prevent campus seeding", async () => {
    const database = new Database(":memory:");

    try {
        initializeDatabase(database, schema);
        database.prepare(`
            INSERT INTO ADMINISTRATOR (
                Administrator_ID,
                Administrator_Email,
                Administrator_passwordHash
            ) VALUES ('existing-admin', 'existing@example.invalid', 'existing-hash')
        `).run();
        database.prepare(`
            INSERT INTO PARKING_FEEDBACK (
                Parking_Area_Name,
                User_Type,
                Rating
            ) VALUES ('Existing feedback area', 'Student', 4)
        `).run();

        const seeded = await seedCampusData(database, { onlyIfEmpty: true });

        assert.ok(seeded);
        assert.ok(seeded.buildings > 0);
        assert.ok(seeded.parkingAreas > 0);
        assert.equal(
            database.prepare("SELECT COUNT(*) AS count FROM ADMINISTRATOR").get().count,
            1,
        );
        assert.equal(
            database.prepare("SELECT COUNT(*) AS count FROM PARKING_FEEDBACK").get().count,
            1,
        );
    } finally {
        database.close();
    }
});
