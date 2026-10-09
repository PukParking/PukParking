import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeDatabase } from "./initialize.js";

const dataDirectory = dirname(fileURLToPath(import.meta.url));
const databasePath = join(dataDirectory, "pukparking.sqlite");
const schemaPath = join(dataDirectory, "table structure.sql");

if (!existsSync(databasePath)) {
    mkdirSync(dataDirectory, { recursive: true });
}

const database = new Database(databasePath);
initializeDatabase(database, readFileSync(schemaPath, "utf8"));

export default database;
