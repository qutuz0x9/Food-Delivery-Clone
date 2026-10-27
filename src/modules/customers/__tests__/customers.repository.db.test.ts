import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db, type Tx } from "../../../prisma/db.js";
import { withRollback } from "../../../test/with-rollback.js";
import { CustomersRepository } from "../customers.repository.js";

// Runs against the db-test container: `npm run test:db:up`, `npm run test:db:migrate`, then `npm run test:db`.
// Every test runs in a transaction that is rolled back (withRollback), so the test database stays empty.

const repository = new CustomersRepository(db);

// A user with unique values, so tests never collide with each other.
const createUser = async (tx: Tx): Promise<string> => {
  const id = randomUUID();
  const user = await tx.orm.identity.User.create({
    email: `User-${id}@Example.com`,
    normalizedEmail: `user-${id}@example.com`,
    passwordHash: "scrypt$salt$hash",
    phoneNumber: `+2011${Math.floor(Math.random() * 1e8).toString().padStart(8, "0")}`,
  });
  return user.id;
};

afterAll(async () => {
  await db.close();
});

describe("CustomersRepository (database)", () => {
  describe("findByUserId", () => {
    it("returns the customer profile of that user", async () => {
      await withRollback(async (tx) => {
        const userId = await createUser(tx);
        const profile = await repository.createProfile({ userId, firstName: "John", lastName: "Doe" }, tx);

        const found = await repository.findByUserId(userId, tx);

        expect(found).toMatchObject({ id: profile.id, userId, firstName: "John", lastName: "Doe" });
      });
    });

    it("returns null for a user with no customer profile (e.g. a driver)", async () => {
      await withRollback(async (tx) => {
        const userId = await createUser(tx);

        expect(await repository.findByUserId(userId, tx)).toBeNull();
      });
    });

    it("returns only that user's profile when several exist", async () => {
      await withRollback(async (tx) => {
        const first = await createUser(tx);
        const second = await createUser(tx);
        await repository.createProfile({ userId: first, firstName: "First", lastName: "User" }, tx);
        await repository.createProfile({ userId: second, firstName: "Second", lastName: "User" }, tx);

        expect((await repository.findByUserId(second, tx))?.firstName).toBe("Second");
      });
    });
  });
});
