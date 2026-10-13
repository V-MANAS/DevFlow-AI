import jwt from "jsonwebtoken";
import { prisma } from "../configs/prisma.js";

/**
 * JWT Authentication Middleware
 * Protects routes by validating HTTP-only JWT token or Bearer token header.
 * Attaches the authenticated database user object to `req.user`.
 */
export const protect = async (req, res, next) => {
  try {
    // 1. Extract token from HTTP-only cookie or Authorization header
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Access denied. Token missing." });
    }

    // 2. Verify token signature & expiration
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is missing in environment variables");
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // 3. Fetch user from database (excluding sensitive fields)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // 4. Attach verified user object to Express request object
    req.user = user;

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    console.error("JWT Auth Error:", error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// Export protectJWT alias for consistency
export const protectJWT = protect;