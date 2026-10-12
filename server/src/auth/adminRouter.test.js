import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { once } from "node:events";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";

import { initializeDatabase } from "../../data/initialize.js";
import { provisionFirstAdministrator } from "../admin/provisionFirstAdministrator.js";
import { createApp } from "../app.js";

const TEST_JWT_SECRET = "test-only-signing-secret-at-least-32-bytes";
const TEST_CLIENT_ORIGIN = "http://localhost:5173";
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(
    currentDirectory,
    "../../data/table structure.sql",
);

async function createAuthTestServer() {
    const database = new Database(":memory:");
    initializeDatabase(database, readFileSync(schemaPath, "utf8"));
    const administrator = await provisionFirstAdministrator(
        database,
        "admin@example.com",
        "correct horse battery staple",
    );

    const app = createApp({
        database,
        jwtSecret: TEST_JWT_SECRET,
        clientOrigin: TEST_CLIENT_ORIGIN,
    });
    const server = app.listen(0);
    await once(server, "listening");

    return { database, server, port: server.address().port, administratorId: administrator.id };
}

async function postLogin(port, payload) {
    return fetch(`http://localhost:${port}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Origin: TEST_CLIENT_ORIGIN,
        },
        body: JSON.stringify(payload),
    });
}

async function postPasswordChange(port, cookie, payload) {
    return fetch(`http://localhost:${port}/api/auth/change-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Origin: TEST_CLIENT_ORIGIN,
            Cookie: cookie,
        },
        body: JSON.stringify(payload),
    });
}

async function loginCookie(port, password = "correct horse battery staple") {
    const response = await postLogin(port, {
        email: "admin@example.com",
        password,
    });
    return response.headers.get("set-cookie").split(";")[0];
}

test("login sets a short-lived HttpOnly JWT cookie without exposing the hash", async () => {
    const { database, server, port, administratorId } = await createAuthTestServer();

    try {
        const response = await postLogin(port, {
            email: " ADMIN@EXAMPLE.COM ",
            password: "correct horse battery staple",
        });
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.expiresIn, 900);
        assert.deepEqual(body.administrator, {
            id: administratorId,
            email: "admin@example.com",
            permissions: null,
        });
        assert.equal("passwordHash" in body, false);
        assert.equal("Administrator_passwordHash" in body, false);

        const setCookie = response.headers.get("set-cookie");
        assert.match(setCookie, /pukparking_admin_token=/);
        assert.match(setCookie, /HttpOnly/i);
        assert.match(setCookie, /SameSite=Strict/i);
        assert.match(setCookie, /Path=\/api/i);

        const cookieToken = setCookie.match(
            /pukparking_admin_token=([^;]+)/,
        )[1];
        const claims = jwt.verify(cookieToken, TEST_JWT_SECRET, {
            algorithms: ["HS256"],
        });
        assert.equal(claims.sub, administratorId);
        assert.equal(claims.email, "admin@example.com");
        assert.equal(claims.exp - claims.iat, 900);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
        database.close();
    }
});

test("session endpoint accepts the HttpOnly cookie and rejects missing sessions", async () => {
    const { database, server, port, administratorId } = await createAuthTestServer();

    try {
        const missingSession = await fetch(
            `http://localhost:${port}/api/auth/me`,
        );
        const loginResponse = await postLogin(port, {
            email: "admin@example.com",
            password: "correct horse battery staple",
        });
        const cookie = loginResponse.headers
            .get("set-cookie")
            .split(";")[0];
        const currentSession = await fetch(
            `http://localhost:${port}/api/auth/me`,
            { headers: { Cookie: cookie } },
        );

        assert.equal(missingSession.status, 401);
        assert.equal(currentSession.status, 200);
        assert.deepEqual(await currentSession.json(), {
            administrator: {
                id: administratorId,
                email: "admin@example.com",
                permissions: null,
            },
        });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
        database.close();
    }
});

test("logout clears the session cookie", async () => {
    const { database, server, port } = await createAuthTestServer();

    try {
        const response = await fetch(
            `http://localhost:${port}/api/auth/logout`,
            {
                method: "POST",
                headers: { Origin: TEST_CLIENT_ORIGIN },
            },
        );

        assert.equal(response.status, 204);
        assert.match(
            response.headers.get("set-cookie"),
            /Expires=Thu, 01 Jan 1970 00:00:00 GMT/i,
        );
        assert.match(response.headers.get("set-cookie"), /HttpOnly/i);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
        database.close();
    }
});

test("authentication endpoints reject an untrusted browser origin", async () => {
    const { database, server, port } = await createAuthTestServer();

    try {
        const response = await fetch(
            `http://localhost:${port}/api/auth/logout`,
            {
                method: "POST",
                headers: { Origin: "https://untrusted.example" },
            },
        );

        assert.equal(response.status, 403);
        assert.deepEqual(await response.json(), {
            error: "Request origin not allowed",
        });
        assert.equal(response.headers.get("set-cookie"), null);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
        database.close();
    }
});

test("login rejects invalid email or password with the same response", async () => {
    const { database, server, port } = await createAuthTestServer();

    try {
        const wrongPassword = await postLogin(port, {
            email: "admin@example.com",
            password: "not the correct password",
        });
        const missingEmail = await postLogin(port, {
            email: "missing@example.com",
            password: "correct horse battery staple",
        });

        assert.equal(wrongPassword.status, 401);
        assert.equal(missingEmail.status, 401);
        assert.deepEqual(await wrongPassword.json(), {
            error: "Invalid email or password.",
        });
        assert.deepEqual(await missingEmail.json(), {
            error: "Invalid email or password.",
        });
        assert.equal(wrongPassword.headers.get("set-cookie"), null);
        assert.equal(missingEmail.headers.get("set-cookie"), null);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
        database.close();
    }
});

test("login rate-limits repeated failed attempts from the same IP", async () => {
    const { database, server, port } = await createAuthTestServer();

    try {
        for (let attempt = 0; attempt < 5; attempt += 1) {
            const response = await postLogin(port, {
                email: "admin@example.com",
                password: "incorrect password",
            });
            assert.equal(response.status, 401);
        }

        const blockedResponse = await postLogin(port, {
            email: "admin@example.com",
            password: "incorrect password",
        });

        assert.equal(blockedResponse.status, 429);
        assert.deepEqual(await blockedResponse.json(), {
            error: "Too many failed login attempts. Please try again later.",
        });
        assert.ok(Number(blockedResponse.headers.get("retry-after")) > 0);
        assert.ok(blockedResponse.headers.get("ratelimit-remaining"));
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
        database.close();
    }
});

test("login rejects missing credentials", async () => {
    const { database, server, port } = await createAuthTestServer();

    try {
        const response = await postLogin(port, { email: "admin@example.com" });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
            error: "Email and password are required.",
        });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
        database.close();
    }
});

test("administrator can change their password and must sign in again", async () => {
    const { database, server, port, administratorId } = await createAuthTestServer();

    try {
        const cookie = await loginCookie(port);
        const response = await postPasswordChange(port, cookie, {
            currentPassword: "correct horse battery staple",
            newPassword: "a much stronger password phrase",
        });
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.deepEqual(body, {
            message: "Password updated. Please sign in again.",
        });
        assert.match(
            response.headers.get("set-cookie"),
            /Expires=Thu, 01 Jan 1970 00:00:00 GMT/i,
        );

        const storedPasswordHash = database
            .prepare(`
                SELECT Administrator_passwordHash
                FROM ADMINISTRATOR
                WHERE Administrator_ID = ?
            `)
            .get(administratorId).Administrator_passwordHash;
        assert.notEqual(
            storedPasswordHash,
            "correct horse battery staple",
        );

        const oldPasswordLogin = await postLogin(port, {
            email: "admin@example.com",
            password: "correct horse battery staple",
        });
        const newPasswordLogin = await postLogin(port, {
            email: "admin@example.com",
            password: "a much stronger password phrase",
        });

        assert.equal(oldPasswordLogin.status, 401);
        assert.equal(newPasswordLogin.status, 200);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
        database.close();
    }
});

test("password change rejects an incorrect current password", async () => {
    const { database, server, port } = await createAuthTestServer();

    try {
        const cookie = await loginCookie(port);
        const response = await postPasswordChange(port, cookie, {
            currentPassword: "incorrect current password",
            newPassword: "a much stronger password phrase",
        });

        assert.equal(response.status, 401);
        assert.deepEqual(await response.json(), {
            error: "Current password is incorrect.",
        });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
        database.close();
    }
});

test("password change enforces the existing new-password policy", async () => {
    const { database, server, port } = await createAuthTestServer();

    try {
        const cookie = await loginCookie(port);
        const response = await postPasswordChange(port, cookie, {
            currentPassword: "correct horse battery staple",
            newPassword: "short",
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
            error: "Password must be at least 15 characters long.",
        });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
        database.close();
    }
});

test("password change requires an authenticated trusted-origin request", async () => {
    const { database, server, port } = await createAuthTestServer();

    try {
        const unauthenticated = await postPasswordChange(port, "", {
            currentPassword: "correct horse battery staple",
            newPassword: "a much stronger password phrase",
        });
        const untrustedOrigin = await fetch(
            `http://localhost:${port}/api/auth/change-password`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Origin: "https://untrusted.example",
                },
                body: JSON.stringify({
                    currentPassword: "correct horse battery staple",
                    newPassword: "a much stronger password phrase",
                }),
            },
        );

        assert.equal(unauthenticated.status, 401);
        assert.equal(untrustedOrigin.status, 403);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
        database.close();
    }
});
