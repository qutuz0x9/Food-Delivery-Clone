import "dotenv/config";
import { z } from "zod";

// Apart from env.ts, so the seed can run with DATABASE_URL and none of the app's secrets.
const databaseEnvSchema = z.object({
  DATABASE_URL: z.url("DATABASE_URL must be a valid connection URL, e.g. postgresql://user:password@host:5432/db"),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export const databaseEnv: DatabaseEnv = databaseEnvSchema.parse(process.env);
