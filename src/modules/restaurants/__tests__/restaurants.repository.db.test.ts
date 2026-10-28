import { randomUUID } from "node:crypto";
import type { Numeric, TimestampString, Varchar } from "@prisma/orm-postgres/target/codec-types";
import { afterAll, describe, expect, it } from "vitest";
import { db, type Tx } from "../../../prisma/db.js";
import { withRollback } from "../../../test/with-rollback.js";
import { RestaurantsRepository } from "../restaurants.repository.js";

// Runs against the db-test container: `npm run test:db:up`, `npm run test:db:migrate`, then `npm run test:db`.
// Every test runs in a transaction that is rolled back (withRollback), so the test database stays empty.

const repository = new RestaurantsRepository(db);

interface RestaurantSetup {
  readonly status?: "pending" | "approved" | "rejected";
  readonly accountStatus?: "active" | "inactive" | "locked" | "suspended";
  readonly deleted?: boolean;
  readonly branch?: "active" | "inactive" | "none";
  readonly cuisines: readonly { readonly name: string; readonly isActive?: boolean }[];
}

// A user, its restaurant, one branch and the cuisine tags. The defaults make a restaurant customers can see.
const createRestaurant = async (tx: Tx, setup: RestaurantSetup): Promise<void> => {
  const userId = randomUUID();
  await tx.orm.identity.User.create({
    id: userId,
    email: `restaurant-${userId}@example.com`,
    normalizedEmail: `RESTAURANT-${userId}@EXAMPLE.COM`,
    passwordHash: "scrypt$salt$hash",
    phoneNumber: `+2011${Math.floor(Math.random() * 1e8).toString().padStart(8, "0")}`,
    accountStatus: setup.accountStatus ?? "active",
    deletedAt: setup.deleted ? (new Date().toISOString() as TimestampString<6>) : null,
  });

  const restaurantId = randomUUID();
  await tx.orm.public.Restaurant.create({
    id: restaurantId,
    userId,
    name: `Restaurant ${restaurantId}` as Varchar<150>,
    status: setup.status ?? "approved",
  });

  if ((setup.branch ?? "active") !== "none") {
    const cityId = randomUUID();
    await tx.orm.public.City.create({
      id: cityId,
      name: `City ${cityId}` as Varchar<100>,
      country: "Egypt" as Varchar<100>,
    });
    await tx.orm.public.RestaurantBranch.create({
      id: randomUUID(),
      restaurantId,
      cityId,
      label: "Main" as Varchar<100>,
      street: "1 Test Street",
      latitude: "30.044420" as Numeric<9, 6>,
      longitude: "31.235712" as Numeric<9, 6>,
      isActive: setup.branch !== "inactive",
    });
  }

  for (const cuisine of setup.cuisines) {
    await tx.orm.public.RestaurantCategory.create({
      id: randomUUID(),
      restaurantId,
      name: cuisine.name as Varchar<150>,
      isActive: cuisine.isActive ?? true,
    });
  }
};

// Only this test's names, so rows from other tests or a seeded database can't change the result.
const ours = (names: string[], tag: string): string[] => names.filter((name) => name.startsWith(tag));

afterAll(async () => {
  await db.close();
});

describe("RestaurantsRepository (database)", () => {
  describe("findPublicCuisineNames", () => {
    it("returns each name once, sorted, even when several restaurants share it", async () => {
      await withRollback(async (tx) => {
        const tag = randomUUID();
        await createRestaurant(tx, { cuisines: [{ name: `${tag} Grills` }, { name: `${tag} Burgers` }] });
        await createRestaurant(tx, { cuisines: [{ name: `${tag} Burgers` }, { name: `${tag} Desserts` }] });

        const names = ours(await repository.findPublicCuisineNames(tx), tag);

        expect(names).toStrictEqual([`${tag} Burgers`, `${tag} Desserts`, `${tag} Grills`]);
      });
    });

    it("leaves out hidden tags", async () => {
      await withRollback(async (tx) => {
        const tag = randomUUID();
        await createRestaurant(tx, {
          cuisines: [{ name: `${tag} Shown` }, { name: `${tag} Hidden`, isActive: false }],
        });

        expect(ours(await repository.findPublicCuisineNames(tx), tag)).toStrictEqual([`${tag} Shown`]);
      });
    });

    it("leaves out restaurants customers can't see", async () => {
      await withRollback(async (tx) => {
        const tag = randomUUID();
        await createRestaurant(tx, { cuisines: [{ name: `${tag} Visible` }] });
        await createRestaurant(tx, { status: "pending", cuisines: [{ name: `${tag} Pending` }] });
        await createRestaurant(tx, { status: "rejected", cuisines: [{ name: `${tag} Rejected` }] });
        await createRestaurant(tx, { accountStatus: "suspended", cuisines: [{ name: `${tag} Suspended` }] });
        await createRestaurant(tx, { deleted: true, cuisines: [{ name: `${tag} Deleted` }] });
        await createRestaurant(tx, { branch: "inactive", cuisines: [{ name: `${tag} Inactive branch` }] });
        await createRestaurant(tx, { branch: "none", cuisines: [{ name: `${tag} No branch` }] });

        expect(ours(await repository.findPublicCuisineNames(tx), tag)).toStrictEqual([`${tag} Visible`]);
      });
    });
  });
});
