import { randomUUID } from "node:crypto";
import type { TimestampString } from "@prisma/orm-postgres/target/codec-types";
import { afterAll, describe, expect, it } from "vitest";
import { AppError } from "../../../common/errors/app-error.js";
import { db, type Tx } from "../../../prisma/db.js";
import { withRollback } from "../../../test/with-rollback.js";
import { EmailAlreadyExistsError, PhoneNumberInUseError } from "../auth.errors.js";
import { AuthRepository, type NewUser } from "../auth.repository.js";

// Runs against the db-test container: `npm run test:db:up`, `npm run test:db:migrate`, then `npm run test:db`.
// Every test runs in a transaction that is rolled back (withRollback), so the test database stays empty.

const repository = new AuthRepository(db);

// Unique values per call, so tests never collide with each other.
const newUser = (overrides: Partial<NewUser> = {}): NewUser => {
  const id = randomUUID();
  return {
    email: `User-${id}@Example.com`,
    normalizedEmail: `user-${id}@example.com`,
    passwordHash: "scrypt$salt$hash",
    phoneNumber: `+2010${Math.floor(Math.random() * 1e8).toString().padStart(8, "0")}`,
    ...overrides,
  };
};

const softDelete = async (userId: string, tx: Tx): Promise<void> => {
  await tx.orm.identity.User.where({ id: userId }).update({ deletedAt: new Date().toISOString() as TimestampString<6> });
};

// Resolves to the error a promise rejects with, or fails the test if it resolves.
const rejectionOf = async (promise: Promise<unknown>): Promise<unknown> => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("expected the promise to reject");
};

afterAll(async () => {
  await db.close();
});

describe("AuthRepository (database)", () => {
  describe("findUserByNormalizedEmail", () => {
    it("returns the user with that normalized email", async () => {
      await withRollback(async (tx) => {
        const created = await tx.orm.identity.User.create(newUser());

        const found = await repository.findUserByNormalizedEmail(created.normalizedEmail, tx);

        expect(found?.id).toBe(created.id);
      });
    });

    it("returns null when no user has that email", async () => {
      await withRollback(async (tx) => {
        expect(await repository.findUserByNormalizedEmail(`nobody-${randomUUID()}@example.com`, tx)).toBeNull();
      });
    });

    it("does not return a soft-deleted user", async () => {
      await withRollback(async (tx) => {
        const created = await tx.orm.identity.User.create(newUser());
        await softDelete(created.id, tx);

        expect(await repository.findUserByNormalizedEmail(created.normalizedEmail, tx)).toBeNull();
      });
    });
  });

  describe("findUserByPhoneNumber", () => {
    it("returns the user with that phone number", async () => {
      await withRollback(async (tx) => {
        const created = await tx.orm.identity.User.create(newUser());

        expect((await repository.findUserByPhoneNumber(created.phoneNumber, tx))?.id).toBe(created.id);
      });
    });

    it("does not return a soft-deleted user", async () => {
      await withRollback(async (tx) => {
        const created = await tx.orm.identity.User.create(newUser());
        await softDelete(created.id, tx);

        expect(await repository.findUserByPhoneNumber(created.phoneNumber, tx)).toBeNull();
      });
    });
  });

  describe("createUser", () => {
    it("inserts the user and returns the row with a generated id", async () => {
      await withRollback(async (tx) => {
        const data = newUser();

        const user = await repository.createUser(data, tx);

        expect(user.id).toEqual(expect.any(String));
        expect(user).toMatchObject({ email: data.email, normalizedEmail: data.normalizedEmail, accountStatus: "active" });
      });
    });

    it("throws EmailAlreadyExistsError when the normalized email is taken", async () => {
      await withRollback(async (tx) => {
        const first = await repository.createUser(newUser(), tx);

        // Same email in another case: only users_normalized_email_key catches it.
        const error = await rejectionOf(
          repository.createUser(newUser({ email: first.email.toUpperCase(), normalizedEmail: first.normalizedEmail }), tx),
        );

        expect(error).toBeInstanceOf(EmailAlreadyExistsError);
      });
    });

    it("throws PhoneNumberInUseError when the phone number is taken", async () => {
      await withRollback(async (tx) => {
        const first = await repository.createUser(newUser(), tx);

        const error = await rejectionOf(repository.createUser(newUser({ phoneNumber: first.phoneNumber }), tx));

        expect(error).toBeInstanceOf(PhoneNumberInUseError);
      });
    });

    it("rethrows any other database error unchanged, not as a 409", async () => {
      await withRollback(async (tx) => {
        // email is NOT NULL: a different kind of failure than a duplicate.
        const error = await rejectionOf(repository.createUser(newUser({ email: null as unknown as string }), tx));

        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(AppError);
      });
    });
  });

  describe("findRoleIdByName", () => {
    it("returns the id of the role, ignoring a soft-deleted one", async () => {
      await withRollback(async (tx) => {
        const active = await tx.orm.identity.Role.create({ name: "Customer", normalizedName: "CUSTOMER" });

        expect(await repository.findRoleIdByName("Customer", tx)).toBe(active.id);

        await tx.orm.identity.Role.where({ id: active.id }).update({
          deletedAt: new Date().toISOString() as TimestampString<6>,
        });
        expect(await repository.findRoleIdByName("Customer", tx)).toBeNull();
      });
    });
  });

  describe("assignRole and createRefreshToken", () => {
    it("link the role and store the token hash for the user", async () => {
      await withRollback(async (tx) => {
        const user = await tx.orm.identity.User.create(newUser());
        const role = await tx.orm.identity.Role.create({ name: "Customer", normalizedName: "CUSTOMER" });
        const tokenHash = `hash-${randomUUID()}`;

        await repository.assignRole(user.id, role.id, tx);
        await repository.createRefreshToken(
          { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60_000), ipAddress: "203.0.113.7" },
          tx,
        );

        expect(await tx.orm.identity.UserRole.where({ userId: user.id }).first()).toMatchObject({ roleId: role.id });
        expect(await tx.orm.identity.RefreshToken.where({ tokenHash }).first()).toMatchObject({ userId: user.id });
      });
    });
  });
});
