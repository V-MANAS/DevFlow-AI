import express from 'express';
import 'dotenv/config';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import workspaceRouter from './routes/workspaceRoutes.js';
import { protect } from './middlewares/authMiddleware.js';
import projectRouter from './routes/projectRoutes.js';
import taskRouter from './routes/taskRoutes.js';
import commentRouter from './routes/commentRoutes.js';
import authRouter from './routes/authRoutes.js';
import joinRequestRouter from "./routes/joinRequestRoutes.js";
import dependencyRouter from "./routes/dependencyRoutes.js";


const app = express();

app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.get('/',(req,res)=> res.send('Server is live!'));

app.use("/api/inngest", serve({ client: inngest, functions }));

//Routes
app.use("/api/auth", authRouter);
app.use("/api/workspaces",protect,workspaceRouter)
app.use("/api/projects",protect,projectRouter)
app.use("/api/tasks", protect, taskRouter)
app.use("/api/comments",protect,commentRouter)
app.use("/api/join-requests", protect, joinRequestRouter);  
app.use("/api/dependencies", dependencyRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`))