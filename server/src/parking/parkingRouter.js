import { randomUUID } from "node:crypto";
import express from "express";

const FULL_REPORT_TTL_MS = 30 * 60 * 1000;

function validId(value) {
    return typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
        ? value
        : null;
}

function readParkingArea(database, parkingAreaId) {
    const area = database
        .prepare(`
            SELECT
                parking.Parking_Area_ID AS id,
                parking.Parking_Area_Name AS name,
                parking.Parking_Type AS category,
                parking.Parking_Area_Capacity AS capacity,
                parking.Parking_Area_Occupied_Spaces AS storedOccupied,
                parking.Parking_Area_Latitude AS latitude,
                parking.Parking_Area_Longitude AS longitude,
                building.Building_Name AS buildingName,
                EXISTS (
                    SELECT 1
                    FROM PARKING_FULL_REPORT AS report
                    WHERE report.Parking_Area_ID = parking.Parking_Area_ID
                        AND datetime(report.Report_Expiry_Time) > CURRENT_TIMESTAMP
                ) AS isFull,
                (
                    SELECT report.Report_Expiry_Time
                    FROM PARKING_FULL_REPORT AS report
                    WHERE report.Parking_Area_ID = parking.Parking_Area_ID
                        AND datetime(report.Report_Expiry_Time) > CURRENT_TIMESTAMP
                    ORDER BY datetime(report.Report_Expiry_Time) DESC
                    LIMIT 1
                ) AS fullUntil
            FROM PARKING_AREA AS parking
            LEFT JOIN BUILDING AS building
                ON building.Building_ID = parking.Building_ID
            WHERE parking.Parking_Area_ID = ?
                AND COALESCE(parking.Parking_Area_isActive, 1) = 1
        `)
        .get(parkingAreaId);

    if (!area) return null;

    const capacity = Math.max(0, Number(area.capacity) || 0);
    const occupied = area.isFull
        ? capacity
        : Math.min(
            capacity,
            Math.max(0, Number(area.storedOccupied) || 0),
        );
    const longitude = Number(area.longitude);
    const latitude = Number(area.latitude);

    return {
        id: area.id,
        name: area.name,
        category: area.category,
        capacity,
        occupied,
        available: capacity - occupied,
        isFull: Boolean(area.isFull),
        fullUntil: area.fullUntil,
        buildingName: area.buildingName,
        coordinates:
            Number.isFinite(longitude) &&
            Number.isFinite(latitude) &&
            longitude >= -180 &&
            longitude <= 180 &&
            latitude >= -90 &&
            latitude <= 90
                ? [longitude, latitude]
                : null,
    };
}

export function createParkingRouter({ database }) {
    if (!database) {
        throw new Error("Parking routes require a database.");
    }

    const router = express.Router();

    router.get("/areas", (_req, res) => {
        const parkingAreaIds = database
            .prepare(`
                SELECT Parking_Area_ID AS id
                FROM PARKING_AREA
                WHERE COALESCE(Parking_Area_isActive, 1) = 1
                    AND Parking_Area_Latitude BETWEEN -90 AND 90
                    AND Parking_Area_Longitude BETWEEN -180 AND 180
                ORDER BY Parking_Area_Name COLLATE NOCASE, Parking_Area_ID
            `)
            .all();
        const parkingAreas = parkingAreaIds
            .map(({ id }) => readParkingArea(database, id))
            .filter(Boolean);

        return res.json({ parkingAreas });
    });

    router.post("/areas/:id/occupy", (req, res) => {
        const parkingAreaId = validId(req.params.id);
        if (!parkingAreaId) {
            return res.status(400).json({
                error: "Parking area ID must be a valid UUID.",
            });
        }

        const area = database
            .prepare(`
                SELECT Parking_Area_ID AS id,
                    Parking_Area_Name AS name,
                    Parking_Area_Capacity AS capacity,
                    Parking_Area_Occupied_Spaces AS occupied
                FROM PARKING_AREA
                WHERE Parking_Area_ID = ?
                    AND COALESCE(Parking_Area_isActive, 1) = 1
                    AND Parking_Area_Occupied_Spaces < Parking_Area_Capacity
            `)
            .get(parkingAreaId);

        if (!area) {
            const alreadyFull = database
                .prepare(`
                    SELECT Parking_Area_ID AS id,
                        Parking_Area_Capacity AS capacity,
                        Parking_Area_Occupied_Spaces AS occupied
                    FROM PARKING_AREA
                    WHERE Parking_Area_ID = ?
                        AND COALESCE(Parking_Area_isActive, 1) = 1
                `)
                .get(parkingAreaId);

            if (!alreadyFull) {
                return res.status(404).json({
                    error: "Active parking area not found.",
                });
            }

            return res.status(400).json({
                error: "Parking area is already full.",
            });
        }

        database
            .prepare(`
                UPDATE PARKING_AREA
                SET Parking_Area_Occupied_Spaces = Parking_Area_Occupied_Spaces + 1
                WHERE Parking_Area_ID = ?
            `)
            .run(parkingAreaId);

        const updatedArea = readParkingArea(database, parkingAreaId);
        return res.status(200).json({
            success: true,
            availableBays: updatedArea?.available ?? 0,
        });
    });

    router.post("/areas/:id/full-report", (req, res) => {
        const parkingAreaId = validId(req.params.id);
        if (!parkingAreaId) {
            return res.status(400).json({
                error: "Parking area ID must be a valid UUID.",
            });
        }

        const area = readParkingArea(database, parkingAreaId);
        if (!area) {
            return res.status(404).json({
                error: "Active parking area not found.",
            });
        }

        if (!area.isFull) {
            const submittedTime = new Date();
            const expiryTime = new Date(
                submittedTime.getTime() + FULL_REPORT_TTL_MS,
            );

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
                    randomUUID(),
                    parkingAreaId,
                    submittedTime.toISOString(),
                    expiryTime.toISOString(),
                );
        }

        return res.status(200).json({
            parkingArea: readParkingArea(database, parkingAreaId),
            reportExpiresInSeconds: FULL_REPORT_TTL_MS / 1000,
        });
    });

    return router;
}
