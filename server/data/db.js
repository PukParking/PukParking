import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { migrateErdSchema } from "./erdSchemaMigration.js";

const dataDirectory = dirname(fileURLToPath(import.meta.url));
const databasePath = join(dataDirectory, "pukparking.sqlite");
const schemaPath = join(dataDirectory, "table structure.sql");

if (!existsSync(databasePath)) {
    mkdirSync(dataDirectory, { recursive: true });
}

const database = new Database(databasePath);
const schemaSql = readFileSync(schemaPath, "utf8");
database.exec(schemaSql);
migrateErdSchema(database, schemaSql);
database.pragma("foreign_keys = ON");

export default database;
