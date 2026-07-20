import "dotenv/config";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import app from "./app.js";
import { connectMongo } from "./infrastructure/mongo.js";
import { registerSocketServer } from "./realtime/projectEvents.js";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) return next(new Error("Unauthorized"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;

    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("projects:join", (projectIds = []) => {
    if (!Array.isArray(projectIds)) return;

    projectIds.forEach((projectId) => {
      if (!projectId) return;
      socket.join(`project:${projectId}`);
    });

    console.log("Socket joined projects:", projectIds);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

registerSocketServer(io);

(async () => {
  try {
    await connectMongo();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
})();