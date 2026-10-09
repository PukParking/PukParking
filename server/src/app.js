import { randomUUID } from "node:crypto";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import database from "../data/db.js";

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
    `).all();
    res.status(200).json(parkingAreas);
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