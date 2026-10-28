import { randomUUID } from "node:crypto";
import type { Varchar } from "@prisma/orm-postgres/target/codec-types";
import { afterAll, describe, expect, it } from "vitest";
import { db, type Tx } from "../../../prisma/db.js";
import { withRollback } from "../../../test/with-rollback.js";
import { CitiesRepository } from "../cities.repository.js";

// Runs against the db-test container: `npm run test:db:up`, `npm run test:db:migrate`, then `npm run test:db`.
// Every test runs in a transaction that is rolled back (withRollback), so the test database stays empty.

const repository = new CitiesRepository(db);

// cities.id has no database default, so the test creates it, as the app will.
const createCity = async (tx: Tx, name: string, country: string, isActive = true): Promise<string> => {
  const city = await tx.orm.public.City.create({
    id: randomUUID(),
    name: name as Varchar<100>,
    country: country as Varchar<100>,
    isActive,
  });
  return city.id;
};

afterAll(async () => {
  await db.close();
});

describe("CitiesRepository (database)", () => {
  describe("findActive", () => {
    it("returns active cities and leaves out inactive ones", async () => {
      await withRollback(async (tx) => {
        const tag = randomUUID();
        const activeId = await createCity(tx, `Active ${tag}`, "Egypt");
        const inactiveId = await createCity(tx, `Inactive ${tag}`, "Egypt", false);

        const found = await repository.findActive(tx);
        const ids = found.map((city) => city.id);

        expect(ids).toContain(activeId);
        expect(ids).not.toContain(inactiveId);
        expect(found.every((city) => city.isActive)).toBe(true);
      });
    });

    it("sorts by name, then country", async () => {
      await withRollback(async (tx) => {
        // Inserted out of order, and two cities share a name, so only ORDER BY name, country passes.
        const tag = randomUUID();
        const bEgypt = await createCity(tx, `${tag} B`, "Egypt");
        const aUsa = await createCity(tx, `${tag} A`, "USA");
        const aEgypt = await createCity(tx, `${tag} A`, "Egypt");

        const found = await repository.findActive(tx);
        const ours = found.map((city) => city.id).filter((id) => [bEgypt, aUsa, aEgypt].includes(id));

        expect(ours).toStrictEqual([aEgypt, aUsa, bEgypt]);
      });
    });
  });
});
