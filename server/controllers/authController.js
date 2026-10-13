import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../configs/prisma.js";

/* ======================================================
   REGISTER USER API
====================================================== */
export const register = async (req, res) => {
  try {
    const { name, email, password, image } = req.body;

    // 1. Input Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Basic email pattern validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // 3. Hash password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Generate unique ID for user
    const id = crypto.randomUUID();

    // 5. Create new User in database
    const newUser = await prisma.user.create({
      data: {
        id,
        name: name.trim(),
        email: trimmedEmail,
        passwordHash,
        image: image || "",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

/* ======================================================
   LOGIN USER API
====================================================== */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Input Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // 2. Find user in database
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3. Compare password with bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 4. Secrets check
    const secret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!secret || !refreshSecret) {
      throw new Error("JWT environment variables are missing");
    }

    // 5. Generate short-lived Access Token (15 min) and long-lived Refresh Token (7 days)
    const accessToken = jwt.sign({ userId: user.id }, secret, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ userId: user.id }, refreshSecret, {
      expiresIn: "7d",
    });

    // 6. Store Access Token & Refresh Token in HTTP-only Cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 7. Return response excluding passwordHash
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

/* ======================================================
   REFRESH ACCESS TOKEN API
====================================================== */
export const refreshAccessToken = async (req, res) => {
  try {
    // 1. Read refresh token from HTTP-only cookie
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    // 2. Verify refresh token using JWT_REFRESH_SECRET
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
      throw new Error("JWT_REFRESH_SECRET environment variable is missing");
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, refreshSecret);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Refresh token has expired" });
      }
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Invalid refresh token payload" });
    }

    // 3. Fetch user from PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // 4. Generate new short-lived Access Token (15 min)
    const secret = process.env.JWT_SECRET;
    const newAccessToken = jwt.sign({ userId: user.id }, secret, {
      expiresIn: "15m",
    });

    // 5. Update Access Token cookie
    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return res.status(200).json({
      message: "Access token refreshed successfully",
      user,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

/* ======================================================
   LOGOUT USER API
====================================================== */
export const logout = async (req, res) => {
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    // Clear HTTP-only cookies
    res.clearCookie("token", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

/* ======================================================
   GET CURRENT AUTHENTICATED USER (ME)
====================================================== */
export const getMe = async (req, res) => {
  try {
    // req.user is set by protectJWT middleware
    return res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    console.error("GetMe Error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};
