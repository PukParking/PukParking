const { randomBytes } = require("node:crypto");
const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const { dirname, join } = require("node:path");

const projectDirectory = dirname(__dirname);
const serverDirectory = join(projectDirectory, "server");
const envPath = join(serverDirectory, ".env");
const envContents = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const variables = new Map();

for (const line of envContents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) {
        variables.set(match[1], match[2].replace(/^(['"])(.*)\1$/, "$2"));
    }
}

const additions = [];

if (!variables.get("CLIENT_ORIGIN")) {
    additions.push("CLIENT_ORIGIN=http://localhost:5173");
}

const jwtSecret = variables.get("JWT_SECRET");
if (jwtSecret && Buffer.byteLength(jwtSecret, "utf8") < 32) {
    throw new Error(
        "server/.env has a JWT_SECRET shorter than 32 bytes. Replace it with a random secret of at least 32 bytes.",
    );
}
if (!jwtSecret) {
    additions.push(`JWT_SECRET=${randomBytes(32).toString("hex")}`);
}

if (additions.length > 0) {
    const separator = envContents && !envContents.endsWith("\n") ? "\n" : "";
    writeFileSync(envPath, `${envContents}${separator}${additions.join("\n")}\n`, {
        encoding: "utf8",
        flag: "w",
    });
    console.log("Created missing local server settings in server/.env.");
}
