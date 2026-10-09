import jwt from "jsonwebtoken";
import { isAllowedOrigin } from "../security/origin.js";

export const ADMIN_SESSION_COOKIE = "pukparking_admin_token";

export function createRequireAdmin({
    jwtSecret = process.env.JWT_SECRET,
    clientOrigin = process.env.CLIENT_ORIGIN,
} = {}) {
    return function requireAdmin(req, res, next) {
        if (!jwtSecret) {
            return next(new Error("JWT_SECRET is not configured."));
        }

        const cookieToken = req.cookies?.[ADMIN_SESSION_COOKIE];
        const authorization = req.get("authorization");
        const bearerToken = authorization?.startsWith("Bearer ")
            ? authorization.slice("Bearer ".length).trim()
            : null;
        const token = cookieToken || bearerToken;

        if (!token) {
            return res.status(401).json({ error: "Authentication required" });
        }

        if (
            cookieToken &&
            ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
            req.get("origin") &&
            !isAllowedOrigin(req.get("origin"), clientOrigin)
        ) {
            return res.status(403).json({ error: "Request origin not allowed" });
        }

        try {
            const claims = jwt.verify(token, jwtSecret, {
                algorithms: ["HS256"],
            });

            if (
                typeof claims !== "object" ||
                claims === null ||
                typeof claims.sub !== "string" ||
                typeof claims.exp !== "number"
            ) {
                return res
                    .status(401)
                    .json({ error: "Authentication required" });
            }

            req.admin = claims;
            return next();
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                return res
                    .status(401)
                    .json({ error: "Authentication required" });
            }

            return next(error);
        }
    };
}

export function requireAdmin(req, res, next) {
    return createRequireAdmin()(req, res, next);
}