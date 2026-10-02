import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import jwt from "jsonwebtoken";
import test from "node:test";

import { requireAdmin } from "./requireAdmin.js";

const TEST_SECRET = "test-only-secret-do-not-use-in-production";
process.env.JWT_SECRET = TEST_SECRET;

async function requestProtectedRoute(token) {
    const app = express();

    app.get("/protected", requireAdmin, (req, res) => {
        res.json({ adminId: req.admin.sub });
    });

    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const headers = token
            ? { Authorization: `Bearer ${token}` }
            : {};

        return await fetch(`http://localhost:${port}/protected`, { headers });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
}

test("missing bearer token is rejected", async () => {
    const response = await requestProtectedRoute();

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
        error: "Authentication required",
    });
});

test("invalid token is rejected", async () => {
    const response = await requestProtectedRoute("not-a-valid-token");

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
        error: "Authentication required",
    });
});

test("expired token is rejected", async () => {
    const token = jwt.sign(
        { sub: "admin-1" },
        TEST_SECRET,
        { algorithm: "HS256", expiresIn: -1 },
    );
    const response = await requestProtectedRoute(token);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
        error: "Authentication required",
    });
});

test("valid token reaches the protected route", async () => {
    const token = jwt.sign(
        { sub: "admin-1" },
        TEST_SECRET,
        { algorithm: "HS256", expiresIn: "5m" },
    );
    const response = await requestProtectedRoute(token);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { adminId: "admin-1" });
});