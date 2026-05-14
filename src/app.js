import express from "express";
import authRoutes from "./presentation/routes/auth.routes.js";
import projectRoutes from "./presentation/routes/project.routes.js";
import folderAssetRoutes from "./presentation/routes/folder.routes.js";
import { errorHandler } from "./presentation/middleware/error.middleware.js";
import mediaRoutes from "./presentation/routes/media.routes.js";
import transactionRoutes from "./presentation/routes/transaction.routes.js";



const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "inspect-backend" });
});


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/projects", folderAssetRoutes);
app.use("/api/v1/media", mediaRoutes);
app.use("/api/v1/transactions", transactionRoutes);

app.use(errorHandler);

export default app;
