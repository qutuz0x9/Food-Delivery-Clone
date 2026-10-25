import { configDefaults, defineConfig } from "vitest/config";

// `npm test`: the fast unit and route tests. Database tests (*.db.test.ts) need the test database and run with
// `npm run test:db` (vitest.db.config.ts).
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "**/*.db.test.ts"],
  },
});
