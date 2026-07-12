import { PrismaClient } from "@prisma/client";
import { logger } from "../config/logger";

const globalForPrisma = globalThis as typeof globalThis & {
  __prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: [
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

  client.$on("error", (e) => {
    logger.error({ err: e }, "Prisma client error");
  });

  client.$on("warn", (e) => {
    logger.warn({ msg: e.message }, "Prisma client warning");
  });

  return client;
}

export const prisma: PrismaClient =
  globalForPrisma.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}
