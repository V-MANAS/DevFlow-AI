import express from "express";
import { register, login, refreshAccessToken, logout, getMe } from "../controllers/authController.js";
import { protectJWT } from "../middlewares/authMiddleware.js";

const authRouter = express.Router();

// Public auth routes
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refreshAccessToken);
authRouter.post("/logout", logout);

// Protected test route using JWT middleware
authRouter.get("/me", protectJWT, getMe);

export default authRouter;
