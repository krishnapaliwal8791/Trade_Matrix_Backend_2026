import { env } from "./config/env";
import { logger } from "./config/logger";
import { app } from "./app";
import { prisma } from "./lib/prisma";
import http from "http";

const server = http.createServer(app);

server.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: process.env.NODE_ENV ?? "development" },
    "Backend started",
  );
});

function gracefulShutdown(signal: string): void {
  logger.info({ signal }, "Shutdown signal received — closing server");

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, "Error during server shutdown");
      process.exit(1);
    }

    await prisma.$disconnect();

    logger.info("Server closed successfully");

    process.exit(0);
  });
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
