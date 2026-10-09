import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { createManageRouter } from "./admin/manageRouter.js";
import { createAdminAuthRouter } from "./auth/adminRouter.js";
import { createFeedbackRouter } from "./feedback/feedbackRouter.js";
import { createParkingRouter } from "./parking/parkingRouter.js";
import { isAllowedOrigin } from "./security/origin.js";

export function createApp({
    database,
    jwtSecret,
    clientOrigin = process.env.CLIENT_ORIGIN,
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
            origin: (requestOrigin, callback) => {
                callback(null, isAllowedOrigin(requestOrigin, clientOrigin));
            },
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            allowedHeaders: ["Content-Type", "Authorization"],
        }),
    );

    app.use(express.json({ limit: "10kb" }));
    app.use(cookieParser());

    app.get("/api/health", (_req, res) => {
        res.status(200).json({ status: "ok" });
    });

    if (database && jwtSecret) {
        app.use(
            "/api/auth",
            createAdminAuthRouter({ database, jwtSecret, clientOrigin }),
        );
        app.use(
            "/api/admin",
            createManageRouter({ database, jwtSecret, clientOrigin }),
        );
        app.use(
            "/api/feedback",
            createFeedbackRouter({ database, clientOrigin }),
        );
        app.use(
            "/api/parking",
            createParkingRouter({ database, clientOrigin }),
        );
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
        res.status(404).json({ error: "Not found" });
    });

    return app;
}

const app = createApp();

export default app;