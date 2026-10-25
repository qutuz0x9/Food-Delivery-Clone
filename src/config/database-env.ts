import "dotenv/config";
import { z } from "zod";

// The one setting the database client needs, checked when db.ts is loaded, so a missing or broken URL stops the app
// at startup instead of failing on the first query. Kept apart from env.ts on purpose: scripts that only touch the
// database (the seed, run in the migrate container) get DATABASE_URL and none of the app's secrets.
const databaseEnvSchema = z.object({
  DATABASE_URL: z.url("DATABASE_URL must be a valid connection URL, e.g. postgresql://user:password@host:5432/db"),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export const databaseEnv: DatabaseEnv = databaseEnvSchema.parse(process.env);
