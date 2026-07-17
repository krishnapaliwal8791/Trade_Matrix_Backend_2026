import { Socket } from "socket.io";
import { EVENT } from "./rooms";
import { logger } from "../config/logger";

export const registerConnectionHandlers = (socket: Socket) => {
  // Join the shared EVENT room on every successful connection
  socket.join(EVENT);

  // Register disconnect handling if appropriate
  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "Socket disconnected");
  });
};
