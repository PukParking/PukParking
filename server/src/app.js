import { randomUUID } from "node:crypto";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import database from "../data/db.js";
import { verifyPassword } from "./auth/password.js";
import { requireAdmin } from "./auth/requireAdmin.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
    cors({
        origin: (requestOrigin, callback) => {
            callback(null, requestOrigin === process.env.CLIENT_ORIGIN);
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);

app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body ?? {};
    if (
        typeof username !== "string" ||
        !username.trim() ||
        typeof password !== "string" ||
        !password
    ) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    const administrator = database
        .prepare(`
            SELECT Administrator_ID, Administrator_Username, Administrator_passwordHash
            FROM ADMINISTRATOR
            WHERE Administrator_Username = ?
        `)
        .get(username.trim());

    if (
        !administrator ||
        !(await verifyPassword(password, administrator.Administrator_passwordHash))
    ) {
        return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
        {
            sub: administrator.Administrator_ID,
            role: "admin",
            username: administrator.Administrator_Username,
        },
        process.env.JWT_SECRET,
        { algorithm: "HS256", expiresIn: "8h" },
    );

    return res.status(200).json({
        token,
        username: administrator.Administrator_Username,
        expiresIn: 28800,
    });
});

app.get("/api/buildings", (_req, res) => {
    const buildings = database.prepare("SELECT * FROM BUILDING").all();
    res.status(200).json(buildings);
});

app.get("/api/parking-areas", (_req, res) => {
    const parkingAreas = database.prepare(`
        SELECT
            PARKING_AREA.*,
            Parking_Area_Capacity - Parking_Area_Occupied_Spaces AS availableBays,
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM PARKING_FULL_REPORT
                    WHERE PARKING_FULL_REPORT.Parking_Area_ID = PARKING_AREA.Parking_Area_ID
                      AND PARKING_FULL_REPORT.Report_Expiry_Time > CURRENT_TIMESTAMP
                ) THEN 'full'
                WHEN Parking_Area_Capacity - Parking_Area_Occupied_Spaces <= 0 THEN 'full'
                WHEN Parking_Area_Capacity - Parking_Area_Occupied_Spaces <
                     MAX(Parking_Area_Capacity * 0.2, 5) THEN 'almost_full'
                ELSE 'open'
            END AS status
        FROM PARKING_AREA
        WHERE Parking_Area_IsActive = 1
    `).all();
    res.status(200).json(parkingAreas);
});

app.get("/api/admin/parking-areas", requireAdmin, (_req, res) => {
    const parkingAreas = database.prepare(`
        SELECT
            PARKING_AREA.*,
            Parking_Area_Capacity - Parking_Area_Occupied_Spaces AS availableBays
        FROM PARKING_AREA
        ORDER BY Parking_Area_Name
    `).all();
    res.status(200).json(parkingAreas);
});

app.patch("/api/admin/parking-areas/:id", requireAdmin, (req, res) => {
    const currentArea = database
        .prepare(`
            SELECT Parking_Area_Capacity, Parking_Area_Occupied_Spaces
            FROM PARKING_AREA
            WHERE Parking_Area_ID = ?
        `)
        .get(req.params.id);

    if (!currentArea) {
        return res.status(404).json({ error: "Parking area not found" });
    }

    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return res.status(400).json({ error: "A JSON object is required" });
    }

    const keys = Object.keys(body);
    if (
        keys.length === 0 ||
        keys.some((key) => !["availableBays", "isActive"].includes(key))
    ) {
        return res.status(400).json({ error: "Provide availableBays and/or isActive" });
    }

    const values = [];
    const assignments = [];
    if (Object.hasOwn(body, "availableBays")) {
        const { availableBays } = body;
        if (
            !Number.isInteger(availableBays) ||
            availableBays < 0 ||
            availableBays > currentArea.Parking_Area_Capacity
        ) {
            return res.status(400).json({
                error: `availableBays must be an integer between 0 and ${currentArea.Parking_Area_Capacity}`,
            });
        }
        assignments.push("Parking_Area_Occupied_Spaces = ?");
        values.push(currentArea.Parking_Area_Capacity - availableBays);
    }

    if (Object.hasOwn(body, "isActive")) {
        if (typeof body.isActive !== "boolean") {
            return res.status(400).json({ error: "isActive must be a boolean" });
        }
        assignments.push("Parking_Area_IsActive = ?");
        values.push(body.isActive ? 1 : 0);
    }

    values.push(req.params.id);
    database
        .prepare(`UPDATE PARKING_AREA SET ${assignments.join(", ")} WHERE Parking_Area_ID = ?`)
        .run(...values);

    const updatedArea = database
        .prepare(`
            SELECT
                PARKING_AREA.*,
                Parking_Area_Capacity - Parking_Area_Occupied_Spaces AS availableBays
            FROM PARKING_AREA
            WHERE Parking_Area_ID = ?
        `)
        .get(req.params.id);
    return res.status(200).json(updatedArea);
});

app.get("/api/admin/reports", requireAdmin, (_req, res) => {
    const reports = database.prepare(`
        SELECT
            PARKING_FULL_REPORT.*,
            PARKING_AREA.Parking_Area_Name
        FROM PARKING_FULL_REPORT
        JOIN PARKING_AREA
          ON PARKING_AREA.Parking_Area_ID = PARKING_FULL_REPORT.Parking_Area_ID
        ORDER BY Report_Submitted_Time DESC
    `).all();
    res.status(200).json(reports);
});

app.post("/api/parking-areas/:id/report-full", (req, res) => {
    const reportId = randomUUID();
    const result = database.prepare(`
        INSERT INTO PARKING_FULL_REPORT (
            Report_ID,
            Parking_Area_ID,
            Report_Submitted_Time,
            Report_Expiry_Time
        )
        SELECT ?, Parking_Area_ID, CURRENT_TIMESTAMP, datetime('now', '+30 minutes')
        FROM PARKING_AREA
        WHERE Parking_Area_ID = ?
    `).run(reportId, req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({ error: "Parking area not found" });
    }

    const report = database
        .prepare("SELECT Report_ID, Report_Submitted_Time, Report_Expiry_Time FROM PARKING_FULL_REPORT WHERE Report_ID = ?")
        .get(reportId);
    return res.status(201).json(report);
});

app.use((error, _req, res, _next) => {
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Invalid JSON" });
    }

    if (error.type === "entity.too.large") {
        return res.status(413).json({ error: "Request body too large" });
    }

    console.error("Unhandled server error:", error);
    return res.status(500).json({ error: "Internal server error" });
});

app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
});



export default app;