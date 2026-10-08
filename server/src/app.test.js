import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";

import "dotenv/config";

process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const { default: app } = await import("./app.js");

test("health endpoint returns status and security headers", async () => {
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(`http://localhost:${port}/api/health`, {
            headers: {
                Origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
            },
        });

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { status: "ok" });
        assert.equal(response.headers.get("x-content-type-options"), "nosniff");
        assert.equal(response.headers.get("x-powered-by"), null);
        assert.equal(
            response.headers.get("access-control-allow-origin"),
            process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
        );
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("parking areas endpoint returns database rows as a JSON array", async () => {
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(`http://localhost:${port}/api/parking-areas`);

        assert.equal(response.status, 200);
        assert.equal(response.headers.get("content-type")?.includes("application/json"), true);
        assert.equal(Array.isArray(await response.json()), true);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("unknown routes return a JSON 404", async () => {
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(
            `http://localhost:${port}/api/does-not-exist`,
        );

        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), { error: "Not found" });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("malformed JSON returns a JSON 400", async () => {
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(`http://localhost:${port}/api/test`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: '{"broken":',
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { error: "Invalid JSON" });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("oversized JSON returns a JSON 413", async () => {
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(`http://localhost:${port}/api/test`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value: "a".repeat(11 * 1024) }),
        });

        assert.equal(response.status, 413);
        assert.deepEqual(await response.json(), {
            error: "Request body too large",
        });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});

test("CORS does not allow an unconfigured origin", async () => {
    const server = app.listen(0);
    await once(server, "listening");

    try {
        const { port } = server.address();
        const response = await fetch(`http://localhost:${port}/api/health`, {
            headers: {
                Origin: "https://untrusted.example",
            },
        });

        assert.equal(response.status, 200);
        assert.equal(
            response.headers.get("access-control-allow-origin"),
            null,
        );
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
});