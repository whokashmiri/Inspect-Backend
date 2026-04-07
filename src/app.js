import express from "express";
import authRoutes from "./presentation/routes/auth.routes.js";
import { errorHandler } from "./presentation/middleware/error.middleware.js";

const app = express();

app.use(express.json());

app.use("/api/v1/auth", authRoutes);

app.use(errorHandler);

export default app;
