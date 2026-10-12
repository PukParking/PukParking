import { randomUUID } from "node:crypto";
import express from "express";
import { createRequireAdmin } from "../auth/requireAdmin.js";

const PARKING_TYPES = new Set(["Student", "Staff", "Guest"]);

function requiredText(value, fieldName, maxLength = 120) {
    if (typeof value !== "string" || !value.trim()) {
        throw new TypeError(`${fieldName} is required.`);
    }

    const normalizedValue = value.trim();
    if (normalizedValue.length > maxLength) {
        throw new TypeError(`${fieldName} must be at most ${maxLength} characters.`);
    }

    return normalizedValue;
}

function validId(value, fieldName) {
    if (
        typeof value !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ) {
        throw new TypeError(`${fieldName} must be a valid UUID.`);
    }

    return value;
}

function coordinate(value, fieldName, minimum, maximum) {
    if (value === "" || value === null || value === undefined) {
        throw new TypeError(`${fieldName} is required.`);
    }

    const result = Number(value);
    if (!Number.isFinite(result) || result < minimum || result > maximum) {
        throw new TypeError(
            `${fieldName} must be between ${minimum} and ${maximum}.`,
        );
    }

    return result;
}

function buildingValues(body) {
    return {
        name: requiredText(body.name, "Building name"),
        code: requiredText(body.code, "Building code", 32),
        latitude: coordinate(body.latitude, "Latitude", -90, 90),
        longitude: coordinate(body.longitude, "Longitude", -180, 180),
    };
}

function parkingValues(body) {
    const category = requiredText(body.category, "Parking category", 16);
    if (!PARKING_TYPES.has(category)) {
        throw new TypeError("Parking category must be Student, Staff, or Guest.");
    }

    const capacity = Number(body.capacity);
    if (!Number.isSafeInteger(capacity) || capacity < 1) {
        throw new TypeError("Capacity must be a positive whole number.");
    }

    return {
        name: requiredText(body.name, "Parking name"),
        category,
        capacity,
        buildingId: validId(body.buildingId, "Building"),
        latitude: coordinate(body.latitude, "Latitude", -90, 90),
        longitude: coordinate(body.longitude, "Longitude", -180, 180),
    };
}

function respondWithValidationError(res, error) {
    if (error instanceof TypeError) {
        return res.status(400).json({ error: error.message });
    }

    throw error;
}

function buildingExists(database, buildingId) {
    return Boolean(
        database
            .prepare("SELECT 1 FROM BUILDING WHERE Building_ID = ?")
            .get(buildingId),
    );
}

export function createManageRouter({ database, jwtSecret, clientOrigin }) {
    if (!database || !jwtSecret) {
        throw new Error("Admin management routes require a database and JWT secret.");
    }

    const router = express.Router();
    const requireAdmin = createRequireAdmin({ jwtSecret, clientOrigin });

    router.use(requireAdmin);

    router.get("/dashboard", (_req, res) => {
        const parkingAreas = database
            .prepare(`
                SELECT
                    parking.Parking_Area_ID AS id,
                    parking.Parking_Area_Name AS name,
                    parking.Parking_Area_Capacity AS capacity,
                    parking.Parking_Area_Occupied_Spaces AS occupied,
                    EXISTS (
                        SELECT 1
                        FROM PARKING_FULL_REPORT AS report
                        WHERE report.Parking_Area_ID = parking.Parking_Area_ID
                            AND datetime(report.Report_Expiry_Time) > CURRENT_TIMESTAMP
                    ) AS isFull,
                    building.Building_Name AS buildingName
                FROM PARKING_AREA AS parking
                LEFT JOIN BUILDING AS building
                    ON building.Building_ID = parking.Building_ID
                WHERE COALESCE(parking.Parking_Area_isActive, 1) = 1
                ORDER BY parking.Parking_Area_Name COLLATE NOCASE,
                    parking.Parking_Area_ID
            `)
            .all()
            .map((area) => {
                const capacity = Math.max(0, Number(area.capacity) || 0);
                const isFull = Boolean(area.isFull);
                const occupied = isFull
                    ? capacity
                    : Math.min(
                        capacity,
                        Math.max(0, Number(area.occupied) || 0),
                    );

                return {
                    id: area.id,
                    name: area.name,
                    buildingName: area.buildingName,
                    capacity,
                    occupied,
                    available: capacity - occupied,
                    isFull,
                };
            });

        const buildingsCount = database
            .prepare("SELECT COUNT(*) AS count FROM BUILDING")
            .get().count;
        const totals = parkingAreas.reduce(
            (summary, area) => ({
                totalSpaces: summary.totalSpaces + area.capacity,
                occupiedSpaces: summary.occupiedSpaces + area.occupied,
                availableSpaces: summary.availableSpaces + area.available,
            }),
            { totalSpaces: 0, occupiedSpaces: 0, availableSpaces: 0 },
        );

        return res.json({
            summary: {
                ...totals,
                parkingAreas: parkingAreas.length,
                buildings: buildingsCount,
            },
            parkingAreas,
        });
    });

    router.get("/feedback", (req, res) => {
        const conditions = [];
        const parameters = [];
        const rating = req.query.rating;
        const parkingArea = req.query.parkingArea;

        if (rating !== undefined) {
            const parsedRating = Number(rating);
            if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
                return res.status(400).json({
                    error: "Rating filter must be an integer from 1 to 5.",
                });
            }
            conditions.push("Rating = ?");
            parameters.push(parsedRating);
        }

        if (parkingArea !== undefined) {
            if (
                typeof parkingArea !== "string" ||
                !parkingArea.trim() ||
                parkingArea.trim().length > 120
            ) {
                return res.status(400).json({
                    error: "Parking area filter must be 1 to 120 characters.",
                });
            }
            conditions.push("Parking_Area_Name = ?");
            parameters.push(parkingArea.trim());
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";
        const feedback = database
            .prepare(`
                SELECT
                    Feedback_ID AS id,
                    Parking_Area_Name AS parkingAreaName,
                    User_Type AS userType,
                    Rating AS rating,
                    Comment AS comment,
                    Submitted_Time AS submittedAt
                FROM PARKING_FEEDBACK
                ${whereClause}
                ORDER BY Submitted_Time DESC, Feedback_ID DESC
            `)
            .all(...parameters);
        const summary = database
            .prepare(`
                SELECT
                    COUNT(*) AS totalReviews,
                    AVG(Rating) AS averageRating,
                    SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END) AS fiveStarRatings
                FROM PARKING_FEEDBACK
                ${whereClause}
            `)
            .get(...parameters);
        const parkingAreas = database
            .prepare(`
                SELECT DISTINCT Parking_Area_Name AS name
                FROM PARKING_FEEDBACK
                ORDER BY Parking_Area_Name COLLATE NOCASE
            `)
            .all()
            .map((area) => area.name);

        return res.json({
            summary: {
                totalReviews: summary.totalReviews,
                averageRating: summary.averageRating === null
                    ? null
                    : Number(summary.averageRating.toFixed(1)),
                fiveStarRatings: summary.fiveStarRatings ?? 0,
            },
            parkingAreas,
            feedback,
        });
    });

    router.get("/buildings", (_req, res) => {
        const buildings = database
            .prepare(`
                SELECT
                    Building_ID AS id,
                    Building_Name AS name,
                    Building_Abbreviation AS code,
                    Building_Latitude AS latitude,
                    Building_Longitude AS longitude
                FROM BUILDING
                ORDER BY Building_Name COLLATE NOCASE, Building_ID
            `)
            .all();

        return res.json({ buildings });
    });

    router.post("/buildings", (req, res) => {
        let values;
        try {
            values = buildingValues(req.body ?? {});
        } catch (error) {
            return respondWithValidationError(res, error);
        }

        const id = randomUUID();
        database
            .prepare(`
                INSERT INTO BUILDING (
                    Building_ID,
                    Administrator_ID,
                    Building_Name,
                    Building_Abbreviation,
                    Building_Latitude,
                    Building_Longitude
                ) VALUES (?, ?, ?, ?, ?, ?)
            `)
            .run(
                id,
                req.admin.sub,
                values.name,
                values.code,
                values.latitude,
                values.longitude,
            );

        return res.status(201).json({
            building: { id, ...values },
        });
    });

    router.put("/buildings/:id", (req, res) => {
        let id;
        let values;
        try {
            id = validId(req.params.id, "Building ID");
            values = buildingValues(req.body ?? {});
        } catch (error) {
            return respondWithValidationError(res, error);
        }

        const result = database
            .prepare(`
                UPDATE BUILDING
                SET
                    Building_Name = ?,
                    Building_Abbreviation = ?,
                    Building_Latitude = ?,
                    Building_Longitude = ?
                WHERE Building_ID = ?
            `)
            .run(
                values.name,
                values.code,
                values.latitude,
                values.longitude,
                id,
            );

        if (result.changes === 0) {
            return res.status(404).json({ error: "Building not found." });
        }

        return res.json({ building: { id, ...values } });
    });

    router.delete("/buildings/:id", (req, res) => {
        let id;
        try {
            id = validId(req.params.id, "Building ID");
        } catch (error) {
            return respondWithValidationError(res, error);
        }

        if (
            database
                .prepare("SELECT 1 FROM BUILDING WHERE Building_ID = ?")
                .get(id) === undefined
        ) {
            return res.status(404).json({ error: "Building not found." });
        }

        const associatedParking = database
            .prepare("SELECT 1 FROM PARKING_AREA WHERE Building_ID = ? LIMIT 1")
            .get(id);
        if (associatedParking) {
            return res.status(409).json({
                error: "Move or delete parking areas at this building before deleting it.",
            });
        }

        database.prepare("DELETE FROM BUILDING WHERE Building_ID = ?").run(id);
        return res.status(204).end();
    });

    router.get("/parking-areas", (_req, res) => {
        const parkingAreas = database
            .prepare(`
                SELECT
                    parking.Parking_Area_ID AS id,
                    parking.Parking_Area_Name AS name,
                    parking.Parking_Type AS category,
                    parking.Parking_Area_Capacity AS capacity,
                    parking.Building_ID AS buildingId,
                    building.Building_Name AS buildingName,
                    building.Building_Abbreviation AS buildingCode,
                    parking.Parking_Area_Latitude AS latitude,
                    parking.Parking_Area_Longitude AS longitude
                FROM PARKING_AREA AS parking
                LEFT JOIN BUILDING AS building
                    ON building.Building_ID = parking.Building_ID
                ORDER BY parking.Parking_Area_Name COLLATE NOCASE,
                    parking.Parking_Area_ID
            `)
            .all();

        return res.json({ parkingAreas });
    });

    router.post("/parking-areas", (req, res) => {
        let values;
        try {
            values = parkingValues(req.body ?? {});
        } catch (error) {
            return respondWithValidationError(res, error);
        }

        if (!buildingExists(database, values.buildingId)) {
            return res.status(400).json({ error: "Selected building does not exist." });
        }

        const id = randomUUID();
        database
            .prepare(`
                INSERT INTO PARKING_AREA (
                    Parking_Area_ID,
                    Administrator_ID,
                    Building_ID,
                    Parking_Area_Name,
                    Parking_Type,
                    Parking_Area_Capacity,
                    Parking_Area_Occupied_Spaces,
                    Parking_Area_Latitude,
                    Parking_Area_Longitude,
                    Parking_Area_isActive
                ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 1)
            `)
            .run(
                id,
                req.admin.sub,
                values.buildingId,
                values.name,
                values.category,
                values.capacity,
                values.latitude,
                values.longitude,
            );

        return res.status(201).json({
            parkingArea: { id, ...values },
        });
    });

    router.put("/parking-areas/:id", (req, res) => {
        let id;
        let values;
        try {
            id = validId(req.params.id, "Parking area ID");
            values = parkingValues(req.body ?? {});
        } catch (error) {
            return respondWithValidationError(res, error);
        }

        if (!buildingExists(database, values.buildingId)) {
            return res.status(400).json({ error: "Selected building does not exist." });
        }

        const result = database
            .prepare(`
                UPDATE PARKING_AREA
                SET
                    Building_ID = ?,
                    Parking_Area_Name = ?,
                    Parking_Type = ?,
                    Parking_Area_Capacity = ?,
                    Parking_Area_Latitude = ?,
                    Parking_Area_Longitude = ?
                WHERE Parking_Area_ID = ?
            `)
            .run(
                values.buildingId,
                values.name,
                values.category,
                values.capacity,
                values.latitude,
                values.longitude,
                id,
            );

        if (result.changes === 0) {
            return res.status(404).json({ error: "Parking area not found." });
        }

        return res.json({ parkingArea: { id, ...values } });
    });

    router.delete("/parking-areas/:id", (req, res) => {
        let id;
        try {
            id = validId(req.params.id, "Parking area ID");
        } catch (error) {
            return respondWithValidationError(res, error);
        }

        const parkingReport = database
            .prepare("SELECT 1 FROM PARKING_FULL_REPORT WHERE Parking_Area_ID = ? LIMIT 1")
            .get(id);
        if (parkingReport) {
            return res.status(409).json({
                error: "A parking area with reports cannot be deleted.",
            });
        }

        const result = database
            .prepare("DELETE FROM PARKING_AREA WHERE Parking_Area_ID = ?")
            .run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: "Parking area not found." });
        }

        return res.status(204).end();
    });

    return router;
}
