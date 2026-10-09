import "dotenv/config";
import database from "../data/db.js";
import { createApp } from "./app.js";

const port = Number(process.env.PORT || 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid port number between 1 and 65535.");
}

if (!process.env.CLIENT_ORIGIN) {
    throw new Error("CLIENT_ORIGIN must be set in the server environment.");
}

if (
    !process.env.JWT_SECRET ||
    Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32
) {
    throw new Error("JWT_SECRET must be set to a secret of at least 32 bytes.");
}

const app = createApp({
    database,
    jwtSecret: process.env.JWT_SECRET,
});

app.listen(port, () => {
    console.log(`PukParking API listening on port ${port}`);
});