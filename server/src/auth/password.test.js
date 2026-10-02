import assert from "node:assert/strict";
import test from "node:test";

import {
    hashPassword,
    PasswordPolicyError,
    verifyPassword,
} from "./password.js";

test("hashPassword creates a bcrypt hash without retaining the plaintext", async () => {
    const password = "correct horse battery staple";
    const passwordHash = await hashPassword(password);

    assert.match(passwordHash, /^\$2[aby]\$/);
    assert.notEqual(passwordHash, password);
    assert.equal(await verifyPassword(password, passwordHash), true);
});

test("verifyPassword rejects a password that does not match the hash", async () => {
    const passwordHash = await hashPassword("correct horse battery staple");

    assert.equal(await verifyPassword("incorrect password", passwordHash), false);
});

test("hashPassword rejects empty and non-string passwords", async () => {
    await assert.rejects(hashPassword(""), TypeError);
    await assert.rejects(hashPassword(null), TypeError);
});

test("hashPassword rejects passwords shorter than 15 Unicode characters", async () => {
    await assert.rejects(
        hashPassword("short password"),
        (error) => error instanceof PasswordPolicyError && error.code === "PASSWORD_TOO_SHORT",
    );
});

test("hashPassword counts Unicode code points rather than UTF-16 code units", async () => {
    const password = "🔐".repeat(15);
    const passwordHash = await hashPassword(password);

    assert.equal(await verifyPassword(password, passwordHash), true);
});

test("hashPassword rejects common passwords without case sensitivity", async () => {
    await assert.rejects(
        hashPassword("PASSWORD12345678"),
        (error) => error instanceof PasswordPolicyError && error.code === "PASSWORD_TOO_COMMON",
    );
});

test("hashPassword rejects passwords beyond bcrypt's 72-byte input limit", async () => {
    await assert.rejects(
        hashPassword("a".repeat(73)),
        (error) => error instanceof PasswordPolicyError && error.code === "PASSWORD_TOO_LONG",
    );
    await assert.rejects(
        hashPassword("é".repeat(37)),
        (error) => error instanceof PasswordPolicyError && error.code === "PASSWORD_TOO_LONG",
    );
});

test("verifyPassword rejects malformed stored hashes", async () => {
    await assert.rejects(verifyPassword("password", "not-a-bcrypt-hash"), TypeError);
});
