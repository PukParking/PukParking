import express from "express";
import { rateLimit } from "express-rate-limit";
import jwt from "jsonwebtoken";
import {
    hashPassword,
    PasswordPolicyError,
    verifyPassword,
} from "./password.js";
import {
    ADMIN_SESSION_COOKIE,
    createRequireAdmin,
} from "./requireAdmin.js";
import { isAllowedOrigin } from "../security/origin.js";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export function createAdminAuthRouter({
    database,
    jwtSecret,
    clientOrigin,
}) {
    if (
        !database ||
        typeof jwtSecret !== "string" ||
        Buffer.byteLength(jwtSecret, "utf8") < 32
    ) {
        throw new Error(
            "Admin authentication requires a database and a JWT secret of at least 32 bytes.",
        );
    }

    const router = express.Router();
    const requireAdmin = createRequireAdmin({ jwtSecret, clientOrigin });
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api",
    };

    function rejectUntrustedOrigin(req, res) {
        const origin = req.get("origin");
        if (!isAllowedOrigin(origin, clientOrigin)) {
            res.status(403).json({ error: "Request origin not allowed" });
            return true;
        }

        return false;
    }

    function requireTrustedOrigin(req, res, next) {
        if (rejectUntrustedOrigin(req, res)) {
            return;
        }
        return next();
    }

    const loginRateLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 5,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
        message: {
            error: "Too many failed login attempts. Please try again later.",
        },
    });

    const passwordChangeRateLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 5,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
        message: {
            error: "Too many failed password-change attempts. Please try again later.",
        },
    });

    router.post(
        "/login",
        requireTrustedOrigin,
        loginRateLimiter,
        async (req, res) => {
            const { email, password } = req.body ?? {};

            if (
                typeof email !== "string" ||
                typeof password !== "string" ||
                !email.trim() ||
                !password
            ) {
                return res.status(400).json({
                    error: "Email and password are required.",
                });
            }

            if (Buffer.byteLength(password, "utf8") > 72) {
                return res.status(401).json({
                    error: "Invalid email or password.",
                });
            }

            const normalizedEmail = email.trim().toLowerCase();
            const administrator = database
                .prepare(`
                SELECT
                    Administrator_ID AS id,
                    Administrator_Email AS email,
                    Administrator_passwordHash AS passwordHash,
                    Administrator_Permissions AS permissions
                FROM ADMINISTRATOR
                WHERE Administrator_Email = ? COLLATE NOCASE
            `)
                .get(normalizedEmail);

            if (!administrator) {
                return res.status(401).json({
                    error: "Invalid email or password.",
                });
            }

            let passwordMatches;
            try {
                passwordMatches = await verifyPassword(
                    password,
                    administrator.passwordHash,
                );
            } catch (error) {
                if (error instanceof PasswordPolicyError) {
                    return res.status(401).json({
                        error: "Invalid email or password.",
                    });
                }

                throw error;
            }

            if (!passwordMatches) {
                return res.status(401).json({
                    error: "Invalid email or password.",
                });
            }

            const accessToken = jwt.sign(
                { email: administrator.email },
                jwtSecret,
                {
                    algorithm: "HS256",
                    subject: String(administrator.id),
                    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
                },
            );

            res.cookie(ADMIN_SESSION_COOKIE, accessToken, {
                ...cookieOptions,
                maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
            });

            return res.status(200).json({
                expiresIn: ACCESS_TOKEN_TTL_SECONDS,
                administrator: {
                    id: administrator.id,
                    email: administrator.email,
                    permissions: administrator.permissions,
                },
            });
        },
    );

    router.post(
        "/change-password",
        requireTrustedOrigin,
        requireAdmin,
        passwordChangeRateLimiter,
        async (req, res) => {
            const { currentPassword, newPassword } = req.body ?? {};

            if (
                typeof currentPassword !== "string" ||
                typeof newPassword !== "string" ||
                !currentPassword ||
                !newPassword
            ) {
                return res.status(400).json({
                    error: "Current password and new password are required.",
                });
            }

            if (Buffer.byteLength(currentPassword, "utf8") > 72) {
                return res.status(401).json({
                    error: "Current password is incorrect.",
                });
            }

            const administratorId = Number(req.admin.sub);
            const administrator = database
                .prepare(`
                    SELECT Administrator_passwordHash AS passwordHash
                    FROM ADMINISTRATOR
                    WHERE Administrator_ID = ?
                `)
                .get(administratorId);

            if (!administrator) {
                return res
                    .status(401)
                    .json({ error: "Authentication required" });
            }

            const currentPasswordMatches = await verifyPassword(
                currentPassword,
                administrator.passwordHash,
            );

            if (!currentPasswordMatches) {
                return res.status(401).json({
                    error: "Current password is incorrect.",
                });
            }

            let passwordHash;
            try {
                passwordHash = await hashPassword(newPassword);
            } catch (error) {
                if (error instanceof PasswordPolicyError) {
                    return res.status(400).json({ error: error.message });
                }

                throw error;
            }

            database
                .prepare(`
                    UPDATE ADMINISTRATOR
                    SET Administrator_passwordHash = ?
                    WHERE Administrator_ID = ?
                `)
                .run(passwordHash, administratorId);

            res.clearCookie(ADMIN_SESSION_COOKIE, cookieOptions);
            return res.status(200).json({
                message: "Password updated. Please sign in again.",
            });
        },
    );

    router.get("/me", requireAdmin, (req, res) => {
        const administrator = database
            .prepare(`
                SELECT
                    Administrator_ID AS id,
                    Administrator_Email AS email,
                    Administrator_Permissions AS permissions
                FROM ADMINISTRATOR
                WHERE Administrator_ID = ?
            `)
            .get(Number(req.admin.sub));

        if (!administrator) {
            res.clearCookie(ADMIN_SESSION_COOKIE, cookieOptions);
            return res
                .status(401)
                .json({ error: "Authentication required" });
        }

        return res.status(200).json({ administrator });
    });

    router.post("/logout", (req, res) => {
        if (rejectUntrustedOrigin(req, res)) {
            return;
        }

        res.clearCookie(ADMIN_SESSION_COOKIE, cookieOptions);
        return res.status(204).end();
    });

    return router;
}
