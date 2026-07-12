import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .min(1)
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val < 65536, {
      message: "PORT must be a valid port number (1–65535)",
    }),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const formatted = result.error.issues
    .map((issue) => `  [${issue.path.join(".")}] ${issue.message}`)
    .join("\n");
  throw new Error(`Environment validation failed:\n${formatted}`);
}

export const env = Object.freeze(result.data);
