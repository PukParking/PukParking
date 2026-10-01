import cors from "cors";
import express from "express";
import helmet from "helmet";

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