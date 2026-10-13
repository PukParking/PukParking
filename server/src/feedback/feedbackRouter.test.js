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
const schemaPath = join(currentDirectory, "../../data/tableStructure.sql");

async function createFeedbackTestServer() {
    const database = new Database(":memory:");
    initializeDatabase(database, readFileSync(schemaPath, "utf8"));
    const administrator = await provisionFirstAdministrator(
        database,
        "admin@example.com",
        "correct horse battery staple",
    );
    const token = jwt.sign(
        { email: "admin@example.com", sessionVersion: 0 },
        TEST_JWT_SECRET,
        {
            algorithm: "HS256",
            subject: administrator.id,
            expiresIn: "5m",
        },
    );
    const server = createApp({
        database,
        jwtSecret: TEST_JWT_SECRET,
        clientOrigin: TEST_CLIENT_ORIGIN,
    }).listen(0);
    await once(server, "listening");

    return {
        database,
        server,
        port: server.address().port,
        adminCookie: `pukparking_admin_token=${token}`,
    };
}

async function closeFeedbackTestServer({ database, server }) {
    await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
    });
    database.close();
}

async function submitFeedback(port, payload, origin = TEST_CLIENT_ORIGIN) {
    return fetch(`http://localhost:${port}/api/feedback`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Origin: origin,
        },
        body: JSON.stringify(payload),
    });
}

test("public feedback submission stores anonymous rating and optional comment", async () => {
    const testServer = await createFeedbackTestServer();

    try {
        const response = await submitFeedback(testServer.port, {
            parkingAreaName: "  Lovers' Lane Student Parking  ",
            userType: "Student",
            rating: 5,
            comment: "  Easy to find parking.  ",
        });
        const body = await response.json();
        const stored = testServer.database
            .prepare("SELECT * FROM PARKING_FEEDBACK WHERE Feedback_ID = ?")
            .get(body.feedback.id);

        assert.equal(response.status, 201);
        assert.equal(stored.Parking_Area_Name, "Lovers' Lane Student Parking");
        assert.equal(stored.User_Type, "Student");
        assert.equal(stored.Rating, 5);
        assert.equal(stored.Comment, "Easy to find parking.");
        assert.equal(typeof stored.Submitted_Time, "string");
        assert.equal("email" in body.feedback, false);
        assert.equal("userId" in body.feedback, false);
    } finally {
        await closeFeedbackTestServer(testServer);
    }
});

test("public feedback submission validates its rating, category, area, and comment", async () => {
    const testServer = await createFeedbackTestServer();

    try {
        const badRating = await submitFeedback(testServer.port, {
            parkingAreaName: "Parking",
            userType: "Student",
            rating: 6,
        });
        const badCategory = await submitFeedback(testServer.port, {
            parkingAreaName: "Parking",
            userType: "Unknown",
            rating: 4,
        });
        const longComment = await submitFeedback(testServer.port, {
            parkingAreaName: "Parking",
            userType: "Guest",
            rating: 4,
            comment: "x".repeat(1001),
        });

        assert.equal(badRating.status, 400);
        assert.equal(badCategory.status, 400);
        assert.equal(longComment.status, 400);
        assert.equal(
            testServer.database
                .prepare("SELECT COUNT(*) AS count FROM PARKING_FEEDBACK")
                .get().count,
            0,
        );
    } finally {
        await closeFeedbackTestServer(testServer);
    }
});

test("public feedback accepts Visitor as Guest from any origin", async () => {
    const testServer = await createFeedbackTestServer();

    try {
        const accepted = await submitFeedback(testServer.port, {
            parkingAreaName: "Gate 1",
            userType: "Visitor",
            rating: 3,
        });
        const otherOrigin = await submitFeedback(
            testServer.port,
            {
                parkingAreaName: "Gate 1",
                userType: "Guest",
                rating: 3,
            },
            "https://untrusted.example",
        );
        const stored = testServer.database
            .prepare("SELECT User_Type FROM PARKING_FEEDBACK")
            .all();

        assert.equal(accepted.status, 201);
        assert.equal(otherOrigin.status, 201);
        assert.deepEqual(
            stored.map((row) => row.User_Type),
            ["Guest", "Guest"],
        );
    } finally {
        await closeFeedbackTestServer(testServer);
    }
});

test("admin feedback endpoint returns filtered data and accurate summaries", async () => {
    const testServer = await createFeedbackTestServer();

    try {
        await submitFeedback(testServer.port, {
            parkingAreaName: "Parking A",
            userType: "Student",
            rating: 5,
            comment: "Great",
        });
        await submitFeedback(testServer.port, {
            parkingAreaName: "Parking A",
            userType: "Staff",
            rating: 3,
        });
        await submitFeedback(testServer.port, {
            parkingAreaName: "Parking B",
            userType: "Guest",
            rating: 5,
        });

        const unauthorized = await fetch(
            `http://localhost:${testServer.port}/api/admin/feedback`,
        );
        const response = await fetch(
            `http://localhost:${testServer.port}/api/admin/feedback?rating=5&parkingArea=Parking%20A`,
            { headers: { Cookie: testServer.adminCookie } },
        );
        const body = await response.json();
        const invalidFilter = await fetch(
            `http://localhost:${testServer.port}/api/admin/feedback?rating=9`,
            { headers: { Cookie: testServer.adminCookie } },
        );

        assert.equal(unauthorized.status, 401);
        assert.equal(response.status, 200);
        assert.deepEqual(body.summary, {
            totalReviews: 1,
            averageRating: 5,
            fiveStarRatings: 1,
        });
        assert.deepEqual(body.parkingAreas, ["Parking A", "Parking B"]);
        assert.equal(body.feedback.length, 1);
        assert.equal(body.feedback[0].comment, "Great");
        assert.equal(body.feedback[0].userType, "Student");
        assert.equal(invalidFilter.status, 400);
    } finally {
        await closeFeedbackTestServer(testServer);
    }
});
