import { randomUUID } from "node:crypto";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { createManageRouter } from "./admin/manageRouter.js";
import { createAdminAuthRouter } from "./auth/adminRouter.js";
import { createFeedbackRouter } from "./feedback/feedbackRouter.js";
import { createParkingRouter } from "./parking/parkingRouter.js";

const FULL_REPORT_TTL_MS = 30 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createApp({
    database,
    jwtSecret,
} = {}) {
    if (Boolean(database) !== Boolean(jwtSecret)) {
        throw new Error(
            "Both a database and JWT secret are required to configure authentication routes.",
        );
    }

    const app = express();

    app.disable("x-powered-by");
    app.use(helmet());
    app.use(
        cors({
            origin: true,
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            allowedHeaders: ["Content-Type", "Authorization"],
        }),
    );
    app.use(express.json({ limit: "10kb" }));
    app.use(cookieParser());

    app.get("/api/health", (_req, res) => {
        return res.status(200).json({ status: "ok" });
    });

    if (database && jwtSecret) {
        app.use(
            "/api/auth",
            createAdminAuthRouter({ database, jwtSecret }),
        );
        app.use(
            "/api/admin",
            createManageRouter({ database, jwtSecret }),
        );
        app.use(
            "/api/feedback",
            createFeedbackRouter({ database }),
        );
        app.use(
            "/api/parking",
            createParkingRouter({ database }),
        );

        app.get("/api/buildings", (_req, res) => {
            const buildings = database
                .prepare("SELECT * FROM BUILDING ORDER BY Building_Name COLLATE NOCASE")
                .all();
            return res.json(buildings);
        });

        app.get("/api/parking-areas", (_req, res) => {
            const parkingAreas = database
                .prepare(`
                    SELECT
                        parking.*,
                        MAX(
                            0,
                            parking.Parking_Area_Capacity -
                            CASE WHEN EXISTS (
                                SELECT 1 FROM PARKING_FULL_REPORT AS report
                                WHERE report.Parking_Area_ID = parking.Parking_Area_ID
                                    AND datetime(report.Report_Expiry_Time) > CURRENT_TIMESTAMP
                            ) THEN parking.Parking_Area_Capacity
                            ELSE parking.Parking_Area_Occupied_Spaces END
                        ) AS availableBays,
                        CASE
                            WHEN EXISTS (
                                SELECT 1 FROM PARKING_FULL_REPORT AS report
                                WHERE report.Parking_Area_ID = parking.Parking_Area_ID
                                    AND datetime(report.Report_Expiry_Time) > CURRENT_TIMESTAMP
                            ) THEN 'full'
                            WHEN parking.Parking_Area_Capacity -
                                 parking.Parking_Area_Occupied_Spaces <= 0 THEN 'full'
                            WHEN parking.Parking_Area_Capacity -
                                 parking.Parking_Area_Occupied_Spaces <
                                 MAX(parking.Parking_Area_Capacity * 0.2, 5)
                                THEN 'almost_full'
                            ELSE 'open'
                        END AS status
                    FROM PARKING_AREA AS parking
                    WHERE COALESCE(parking.Parking_Area_IsActive, 1) = 1
                `)
                .all();
            return res.json(parkingAreas);
        });

        app.post("/api/parking-areas/:id/report-full", (req, res) => {
            const parkingAreaId = req.params.id;
            if (!UUID_PATTERN.test(parkingAreaId)) {
                return res.status(400).json({
                    error: "Parking area ID must be a valid UUID.",
                });
            }

            const area = database
                .prepare(`
                    SELECT Parking_Area_ID
                    FROM PARKING_AREA
                    WHERE Parking_Area_ID = ?
                        AND COALESCE(Parking_Area_IsActive, 1) = 1
                `)
                .get(parkingAreaId);
            if (!area) {
                return res.status(404).json({ error: "Parking area not found" });
            }

            let report = database
                .prepare(`
                    SELECT Report_ID, Report_Submitted_Time, Report_Expiry_Time
                    FROM PARKING_FULL_REPORT
                    WHERE Parking_Area_ID = ?
                        AND datetime(Report_Expiry_Time) > CURRENT_TIMESTAMP
                    ORDER BY datetime(Report_Expiry_Time) DESC
                    LIMIT 1
                `)
                .get(parkingAreaId);

            if (!report) {
                const submittedTime = new Date();
                const expiryTime = new Date(
                    submittedTime.getTime() + FULL_REPORT_TTL_MS,
                );
                const reportId = randomUUID();
                database
                    .prepare(`
                        INSERT INTO PARKING_FULL_REPORT (
                            Report_ID,
                            Parking_Area_ID,
                            Report_Submitted_Time,
                            Report_Expiry_Time
                        ) VALUES (?, ?, ?, ?)
                    `)
                    .run(
                        reportId,
                        parkingAreaId,
                        submittedTime.toISOString(),
                        expiryTime.toISOString(),
                    );
                report = {
                    Report_ID: reportId,
                    Report_Submitted_Time: submittedTime.toISOString(),
                    Report_Expiry_Time: expiryTime.toISOString(),
                };
            }

            return res.status(201).json(report);
        });
    }

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
        return res.status(404).json({ error: "Not found" });
    });

    return app;
}

const app = createApp();

export default app;
