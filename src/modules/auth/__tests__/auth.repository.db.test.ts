import { randomUUID } from "node:crypto";
import type { TimestampString } from "@prisma/orm-postgres/target/codec-types";
import { afterAll, describe, expect, it } from "vitest";
import { AppError } from "../../../common/errors/app-error.js";
import { db, type DbClient, type Tx } from "../../../prisma/db.js";
import { withRollback } from "../../../test/with-rollback.js";
import { EmailAlreadyExistsError, PhoneNumberInUseError } from "../auth.errors.js";
import { AuthRepository, type NewUser } from "../auth.repository.js";

const repository = new AuthRepository(db);

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

  describe("refresh tokens", () => {
    const inOneDay = (): TimestampString<6> => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() as TimestampString<6>;
    const anHourAgo = (): TimestampString<6> => new Date(Date.now() - 60 * 60 * 1000).toISOString() as TimestampString<6>;

    const insertToken = async (
      tx: DbClient,
      userId: string,
      overrides: { id?: string; revokedAt?: TimestampString<6>; replacedByToken?: string; revokedReason?: string } = {},
    ) =>
      tx.orm.identity.RefreshToken.create({
        id: overrides.id ?? randomUUID(),
        userId,
        tokenHash: `hash-${randomUUID()}`,
        expiresAt: inOneDay(),
        revokedAt: overrides.revokedAt ?? null,
        replacedByToken: overrides.replacedByToken ?? null,
        revokedReason: overrides.revokedReason ?? null,
      });

    const tokenRow = async (tx: Tx, id: string) => tx.orm.identity.RefreshToken.where({ id }).first();

    describe("createRefreshToken", () => {
      it("uses the id it is given, so a rotation can link the old row to it", async () => {
        await withRollback(async (tx) => {
          const user = await tx.orm.identity.User.create(newUser());
          const id = randomUUID();

          await repository.createRefreshToken(
            { id, userId: user.id, tokenHash: `hash-${randomUUID()}`, expiresAt: new Date(Date.now() + 60_000), ipAddress: null },
            tx,
          );

          expect(await tokenRow(tx, id)).toMatchObject({ userId: user.id, revokedAt: null });
        });
      });
    });

    describe("findRefreshTokenByHash", () => {
      it("returns the row with that token hash", async () => {
        await withRollback(async (tx) => {
          const user = await tx.orm.identity.User.create(newUser());
          const token = await insertToken(tx, user.id);

          const found = await repository.findRefreshTokenByHash(token.tokenHash, tx);

          expect(found).toMatchObject({ id: token.id, userId: user.id, revokedAt: null });
        });
      });

      it("returns a revoked row too, so refresh can detect reuse", async () => {
        await withRollback(async (tx) => {
          const user = await tx.orm.identity.User.create(newUser());
          const token = await insertToken(tx, user.id, { revokedAt: anHourAgo(), revokedReason: "rotated" });

          expect((await repository.findRefreshTokenByHash(token.tokenHash, tx))?.id).toBe(token.id);
        });
      });

      it("returns null when no row has that hash", async () => {
        await withRollback(async (tx) => {
          expect(await repository.findRefreshTokenByHash(`hash-${randomUUID()}`, tx)).toBeNull();
        });
      });
    });

    describe("revokeRefreshTokenIfActive", () => {
      it("revokes an active row, links it to its replacement and returns true", async () => {
        await withRollback(async (tx) => {
          const user = await tx.orm.identity.User.create(newUser());
          const token = await insertToken(tx, user.id);
          const replacement = randomUUID();

          const changed = await repository.revokeRefreshTokenIfActive(
            token.id,
            { reason: "rotated", replacedByToken: replacement },
            tx,
          );

          expect(changed).toBe(true);
          const row = await tokenRow(tx, token.id);
          expect(row).toMatchObject({ revokedReason: "rotated", replacedByToken: replacement });
          expect(row?.revokedAt).toEqual(expect.any(String));
        });
      });

      it("returns false and changes nothing when the row is already revoked", async () => {
        await withRollback(async (tx) => {
          const user = await tx.orm.identity.User.create(newUser());
          const first = randomUUID();
          const token = await insertToken(tx, user.id, { revokedAt: anHourAgo(), replacedByToken: first, revokedReason: "rotated" });

          const changed = await repository.revokeRefreshTokenIfActive(
            token.id,
            { reason: "rotated", replacedByToken: randomUUID() },
            tx,
          );

          expect(changed).toBe(false);
          expect(await tokenRow(tx, token.id)).toMatchObject({ replacedByToken: first, revokedAt: token.revokedAt });
        });
      });

      it("returns false when no row has that id", async () => {
        await withRollback(async (tx) => {
          expect(
            await repository.revokeRefreshTokenIfActive(randomUUID(), { reason: "rotated", replacedByToken: randomUUID() }, tx),
          ).toBe(false);
        });
      });
    });

    describe("revokeTokenChain", () => {
      it("revokes every active row rotated from the given one, and leaves revoked rows and other users alone", async () => {
        await withRollback(async (tx) => {
          const user = await tx.orm.identity.User.create(newUser());
          const other = await tx.orm.identity.User.create(newUser());
          const c = await insertToken(tx, user.id);
          const b = await insertToken(tx, user.id, { revokedAt: anHourAgo(), replacedByToken: c.id, revokedReason: "rotated" });
          const a = await insertToken(tx, user.id, { revokedAt: anHourAgo(), replacedByToken: b.id, revokedReason: "rotated" });
          const otherDevice = await insertToken(tx, user.id);
          const otherUsers = await insertToken(tx, other.id);

          const revoked = await repository.revokeTokenChain(a.id, "reuse_detected", tx);

          expect(revoked).toBe(1);
          expect(await tokenRow(tx, c.id)).toMatchObject({ revokedReason: "reuse_detected" });
          expect((await tokenRow(tx, c.id))?.revokedAt).toEqual(expect.any(String));
          expect(await tokenRow(tx, a.id)).toMatchObject({ revokedReason: "rotated", revokedAt: a.revokedAt });
          expect(await tokenRow(tx, b.id)).toMatchObject({ revokedReason: "rotated", revokedAt: b.revokedAt });
          expect(await tokenRow(tx, otherDevice.id)).toMatchObject({ revokedAt: null });
          expect(await tokenRow(tx, otherUsers.id)).toMatchObject({ revokedAt: null });
        });
      });

      it("revokes nothing more for a token revoked without a replacement (e.g. a logout)", async () => {
        await withRollback(async (tx) => {
          const user = await tx.orm.identity.User.create(newUser());
          const token = await insertToken(tx, user.id, { revokedAt: anHourAgo(), revokedReason: "logout" });

          expect(await repository.revokeTokenChain(token.id, "reuse_detected", tx)).toBe(0);
          expect(await tokenRow(tx, token.id)).toMatchObject({ revokedReason: "logout" });
        });
      });

      it("on logout, revokes the live end with reason logout and never writes replaced_by_token", async () => {
        await withRollback(async (tx) => {
          const user = await tx.orm.identity.User.create(newUser());
          const b = await insertToken(tx, user.id);
          const a = await insertToken(tx, user.id, { revokedAt: anHourAgo(), replacedByToken: b.id, revokedReason: "rotated" });

          expect(await repository.revokeTokenChain(a.id, "logout", tx)).toBe(1);
          expect(await tokenRow(tx, b.id)).toMatchObject({ revokedReason: "logout", replacedByToken: null });
          expect(await tokenRow(tx, a.id)).toMatchObject({ revokedReason: "rotated", replacedByToken: b.id });
        });
      });

      // Can't use withRollback (one transaction can't race itself), so it commits real rows and deletes them.
      it("finds the token a parallel refresh is creating: it reads the next link after its own update", async () => {
        const user = await db.orm.identity.User.create(newUser());
        const t1 = await insertToken(db, user.id);
        const t2Id = randomUUID();
        let refreshHoldsLock!: () => void;
        const lockTaken = new Promise<void>((resolve) => {
          refreshHoldsLock = resolve;
        });
        let letRefreshCommit!: () => void;
        const commitAllowed = new Promise<void>((resolve) => {
          letRefreshCommit = resolve;
        });

        try {
          const refresh = db.transaction(async (tx) => {
            await repository.revokeRefreshTokenIfActive(t1.id, { reason: "rotated", replacedByToken: t2Id }, tx);
            await insertToken(tx, user.id, { id: t2Id });
            refreshHoldsLock();
            await commitAllowed;
          });
          await lockTaken;

          // An error becomes the result, so it can't count as unhandled while the test waits.
          const logout = (async (): Promise<unknown> => {
            try {
              return await repository.revokeTokenChain(t1.id, "logout");
            } catch (error) {
              return error;
            }
          })();
          // Let the logout reach T1 and wait on its lock, then let the refresh commit.
          await new Promise((resolve) => setTimeout(resolve, 200));
          letRefreshCommit();
          await refresh;

          expect(await logout).toBe(1);
          expect(await db.orm.identity.RefreshToken.where({ id: t2Id }).first()).toMatchObject({ revokedReason: "logout" });
          expect(await db.orm.identity.RefreshToken.where({ id: t1.id }).first()).toMatchObject({
            revokedReason: "rotated",
            replacedByToken: t2Id,
          });
        } finally {
          letRefreshCommit();
          await db.orm.identity.RefreshToken.where({ userId: user.id }).deleteAndCount();
          await db.orm.identity.User.where({ id: user.id }).deleteAndCount();
        }
      });
    });

    describe("findUserById", () => {
      it("returns the user, but not a soft-deleted or missing one", async () => {
        await withRollback(async (tx) => {
          const user = await tx.orm.identity.User.create(newUser());

          expect((await repository.findUserById(user.id, tx))?.id).toBe(user.id);
          expect(await repository.findUserById(randomUUID(), tx)).toBeNull();

          await softDelete(user.id, tx);
          expect(await repository.findUserById(user.id, tx)).toBeNull();
        });
      });
    });
  });
});
