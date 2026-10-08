import jwt from "jsonwebtoken";

export function requireAdmin(req, res, next) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return next(new Error("JWT_SECRET is not configured."));
    }

    const authorization = req.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required" });
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
        return res.status(401).json({ error: "Authentication required" });
    }

    try {
        const claims = jwt.verify(token, secret, {
            algorithms: ["HS256"],
        });

        if (
            typeof claims !== "object" ||
            claims === null ||
            typeof claims.sub !== "string" ||
            typeof claims.exp !== "number" ||
            claims.role !== "admin"
        ) {
            return res.status(401).json({ error: "Authentication required" });
        }

        req.admin = claims;
        return next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: "Authentication required" });
        }

        return next(error);
    }
}