import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { registerConnectionHandlers } from "./handlers";
import { logger } from "../config/logger";

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer): SocketIOServer => {
  if (io) {
    return io;
  }

  // Create Socket.IO server and configure CORS
  io = new SocketIOServer(server, {
    cors: {
      origin: "*", // Using standard wildcard, can be restricted later if needed
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "New Socket.IO connection");
    registerConnectionHandlers(socket);
  });

  return io;
};

export const getSocketIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized!");
  }
  return io;
};
