import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 12;
const MAX_BCRYPT_PASSWORD_BYTES = 72;
const MIN_PASSWORD_CHARACTERS = 15;
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const COMMON_PASSWORDS = new Set([
    "123456",
    "123456789",
    "12345678",
    "1234567890",
    "password",
    "password1",
    "password123",
    "password12345678",
    "qwerty",
    "qwerty123",
    "letmein",
    "welcome",
    "admin",
    "admin123",
    "administrator",
    "administrator1234",
    "changeme",
    "iloveyou",
    "passw0rd",
    "pukparking",
]);

export class PasswordPolicyError extends Error {
    constructor(code, message) {
        super(message);
        this.name = "PasswordPolicyError";
        this.code = code;
    }
}

function validatePasswordInput(password) {
    if (typeof password !== "string" || password.length === 0) {
        throw new TypeError("Password must be a non-empty string.");
    }

    if (Buffer.byteLength(password, "utf8") > MAX_BCRYPT_PASSWORD_BYTES) {
        throw new PasswordPolicyError(
            "PASSWORD_TOO_LONG",
            "Password must not exceed 72 UTF-8 bytes.",
        );
    }
}

export function validatePasswordPolicy(password) {
    validatePasswordInput(password);

    if (Array.from(password).length < MIN_PASSWORD_CHARACTERS) {
        throw new PasswordPolicyError(
            "PASSWORD_TOO_SHORT",
            `Password must be at least ${MIN_PASSWORD_CHARACTERS} characters long.`,
        );
    }

    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
        throw new PasswordPolicyError(
            "PASSWORD_TOO_COMMON",
            "Choose a password that is not commonly used.",
        );
    }
}

export async function hashPassword(password) {
    validatePasswordPolicy(password);
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
    validatePasswordInput(password);

    if (typeof passwordHash !== "string" || !BCRYPT_HASH_PATTERN.test(passwordHash)) {
        throw new TypeError("Password hash must be a valid bcrypt hash.");
    }

    return bcrypt.compare(password, passwordHash);
}
