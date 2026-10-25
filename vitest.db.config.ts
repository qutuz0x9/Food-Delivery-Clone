import { defineConfig } from "vitest/config";

// `npm run test:db`: integration tests against the db-test container (compose.test.yaml). The script sets
// DOTENV_CONFIG_PATH=.env.test, so src/config/database-env.ts connects to the test database, never to dev.
export default defineConfig({
  test: {
    include: ["src/**/*.db.test.ts"],
  },
});
