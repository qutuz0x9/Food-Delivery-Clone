import "dotenv/config";
import { z } from "zod";

// Every setting the app reads from the environment, checked once at startup so a missing secret stops the app
// from booting instead of failing on the first request. Only module wiring (*.module.ts) imports this file;
// classes get their settings through the constructor, so tests never need a .env.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(15 * 60),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
