import { randomUUID } from "node:crypto";
import type { TimestampString } from "@prisma/orm-postgres/target/codec-types";
import { afterAll, describe, expect, it } from "vitest";
import { db, type Tx } from "../../../prisma/db.js";
import { withRollback } from "../../../test/with-rollback.js";
import { CustomersRepository } from "../customers.repository.js";

const repository = new CustomersRepository(db);

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

const nowTimestamp = (): TimestampString<6> => new Date().toISOString() as TimestampString<6>;

const verifyEmail = async (userId: string, tx: Tx): Promise<void> => {
  await tx.orm.identity.User.where({ id: userId }).update({ emailVerifiedAt: nowTimestamp() });
};

const softDelete = async (userId: string, tx: Tx): Promise<void> => {
  await tx.orm.identity.User.where({ id: userId }).update({ deletedAt: nowTimestamp() });
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

  describe("findProfileByUserId", () => {
    it("returns the profile with the user's email, phone and verification date", async () => {
      await withRollback(async (tx) => {
        const userId = await createUser(tx);
        await verifyEmail(userId, tx);
        const profile = await repository.createProfile({ userId, firstName: "John", lastName: "Doe" }, tx);
        const user = await tx.orm.identity.User.where({ id: userId }).first();

        const found = await repository.findProfileByUserId(userId, tx);

        expect(found).toMatchObject({
          id: profile.id,
          userId,
          firstName: "John",
          lastName: "Doe",
          user: { email: user?.email, phoneNumber: user?.phoneNumber },
        });
        expect(found?.user?.emailVerifiedAt).not.toBeNull();
      });
    });

    it("does not load the user's password hash", async () => {
      await withRollback(async (tx) => {
        const userId = await createUser(tx);
        await repository.createProfile({ userId, firstName: "John", lastName: "Doe" }, tx);

        const found = await repository.findProfileByUserId(userId, tx);

        expect(found?.user).toBeDefined();
        expect(found?.user).not.toHaveProperty("passwordHash");
      });
    });

    it("returns null for an unknown user", async () => {
      await withRollback(async (tx) => {
        expect(await repository.findProfileByUserId(randomUUID(), tx)).toBeNull();
      });
    });

    it("returns null for a user with no customer profile", async () => {
      await withRollback(async (tx) => {
        const userId = await createUser(tx);

        expect(await repository.findProfileByUserId(userId, tx)).toBeNull();
      });
    });

    it("returns null when the user is soft-deleted", async () => {
      await withRollback(async (tx) => {
        const userId = await createUser(tx);
        await repository.createProfile({ userId, firstName: "John", lastName: "Doe" }, tx);
        await softDelete(userId, tx);

        expect(await repository.findProfileByUserId(userId, tx)).toBeNull();
      });
    });
  });
});
