import express from "express";

const USER_TYPES = new Set(["Student", "Staff", "Guest"]);
const MAX_COMMENT_LENGTH = 1000;

function feedbackValues(body) {
    const parkingAreaName =
        typeof body.parkingAreaName === "string"
            ? body.parkingAreaName.trim()
            : "";
    if (!parkingAreaName || parkingAreaName.length > 120) {
        throw new TypeError(
            "Parking area name is required and must be at most 120 characters.",
        );
    }

    const userType = body.userType === "Visitor" ? "Guest" : body.userType;
    if (typeof userType !== "string" || !USER_TYPES.has(userType)) {
        throw new TypeError("User type must be Student, Staff, or Guest.");
    }

    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
        throw new TypeError("A rating from 1 to 5 is required.");
    }

    const comment = body.comment === undefined ? "" : body.comment;
    if (typeof comment !== "string" || comment.length > MAX_COMMENT_LENGTH) {
        throw new TypeError(
            `Comment must be at most ${MAX_COMMENT_LENGTH} characters.`,
        );
    }

    return {
        parkingAreaName,
        userType,
        rating: body.rating,
        comment: comment.trim() || null,
    };
}

export function createFeedbackRouter({ database }) {
    if (!database) {
        throw new Error("Feedback routes require a database.");
    }

    const router = express.Router();

    router.post("/", (req, res) => {
        let values;
        try {
            values = feedbackValues(req.body ?? {});
        } catch (error) {
            if (error instanceof TypeError) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }

        const result = database
            .prepare(`
                INSERT INTO PARKING_FEEDBACK (
                    Parking_Area_Name,
                    User_Type,
                    Rating,
                    Comment
                ) VALUES (?, ?, ?, ?)
            `)
            .run(
                values.parkingAreaName,
                values.userType,
                values.rating,
                values.comment,
            );

        const feedback = database
            .prepare(`
                SELECT
                    Feedback_ID AS id,
                    Submitted_Time AS submittedAt
                FROM PARKING_FEEDBACK
                WHERE Feedback_ID = ?
            `)
            .get(result.lastInsertRowid);

        return res.status(201).json({ feedback });
    });

    return router;
}
