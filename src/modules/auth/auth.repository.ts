import type { Scalars } from "@prisma/orm-postgres/family-contract/types";
import type { TimestampString } from "@prisma/orm-postgres/target/codec-types";
import type { Models } from "../../prisma/contract.d.js";
import type { DbClient } from "../../prisma/db.js";
import {
  EmailAlreadyExistsError,
  PhoneNumberInUseError,
} from "./auth.errors.js";
import type { RevokedReason, RoleName } from "./auth.types.js";

const uniqueViolationConstraint = (error: unknown): string | null => {
  if (typeof error !== "object" || error === null) return null;
  const { sqlState, constraint } = error as {
    sqlState?: unknown;
    constraint?: unknown;
  };
  return sqlState === "23505" && typeof constraint === "string"
    ? constraint
    : null;
};

export type UserRow = Scalars<Models.identity_User>;
export type RefreshTokenRow = Scalars<Models.identity_RefreshToken>;

export interface NewUser {
  readonly email: string;
  readonly normalizedEmail: string;
  readonly passwordHash: string;
  readonly phoneNumber: string;
}

export interface NewRefreshToken {
  // Optional: register and login let the database make it; refresh passes TokenService's id (plan §5).
  readonly id?: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly ipAddress: string | null;
}

// What a rotation writes on the old row, besides revoked_at (always "now").
export interface RefreshTokenRevocation {
  readonly reason: RevokedReason;
  // The id of the row that replaces this one.
  readonly replacedByToken: string;
}

const nowTimestamp = (): TimestampString<6> =>
  new Date().toISOString() as TimestampString<6>;

// Queries for the identity tables the auth module owns: users, user_roles, roles (read only) and refresh_tokens.
// Every method takes an optional client as its last parameter: pass the `tx` from db.transaction to run it inside
// that transaction.
export class AuthRepository {
  private readonly db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  async findUserByNormalizedEmail(
    normalizedEmail: string,
    client: DbClient = this.db,
  ): Promise<UserRow | null> {
    // LEARN-TODO (core, guided): AuthRepository.findUserByNormalizedEmail
    // 1. Find the user by normalizedEmail (a unique field).
    const user = await client.orm.identity.User.where({
      normalizedEmail,
    })
      .where((u) => u.deletedAt.isNull())
      .first();
    // 2. Return the row, or null.
    return user;
  }

  // Refresh loads the token's user. A soft-deleted user counts as gone, the same rule as the email lookup.
  async findUserById(
    id: string,
    client: DbClient = this.db,
  ): Promise<UserRow | null> {
    return client.orm.identity.User.where({ id })
      .where((u) => u.deletedAt.isNull())
      .first();
  }

  async findUserByPhoneNumber(
    phoneNumber: string,
    client: DbClient = this.db,
  ): Promise<UserRow | null> {
    // LEARN-TODO (core, guided): AuthRepository.findUserByPhoneNumber
    // Same as findUserByNormalizedEmail, by phoneNumber (same soft-delete rule).
    const user = await client.orm.identity.User.where({
      phoneNumber,
    })
      .where((u) => u.deletedAt.isNull())
      .first();
    return user;
  }

  async createUser(
    data: NewUser,
    client: DbClient = this.db,
  ): Promise<UserRow> {
    // LEARN-TODO (core, guided): AuthRepository.createUser
    // 1. Insert the user from `data` and return the row.
    // 2. Catch a unique violation: SqlQueryError with sqlState "23505" (plan §7).
    // 3. Email constraint → EmailAlreadyExistsError, phone → PhoneNumberInUseError (plan §5).
    // 4. Rethrow any other error.
    try {
      const user = await client.orm.identity.User.create(data);
      return user;
    } catch (error) {
      const constraint = uniqueViolationConstraint(error); // ← new
      if (
        constraint === "users_email_key" ||
        constraint === "users_normalized_email_key"
      ) {
        // ← new
        throw new EmailAlreadyExistsError(); // ← new
      }
      if (constraint === "users_phone_number_key")
        throw new PhoneNumberInUseError(); // ← new
      throw error;
    }
  }

  // Returns the id of a role that is not soft-deleted, or null when it does not exist.

  async findRoleIdByName(
    name: RoleName,
    client: DbClient = this.db,
  ): Promise<string | null> {
    const role = await client.orm.identity.Role.where({
      normalizedName: name.toUpperCase(),
    })
      .where((r) => r.deletedAt.isNull())
      .select("id")
      .first();
    return role?.id ?? null;
  }

  async assignRole(
    userId: string,
    roleId: string,
    client: DbClient = this.db,
  ): Promise<void> {
    await client.orm.identity.UserRole.create({ userId, roleId });
  }

  async createRefreshToken(
    data: NewRefreshToken,
    client: DbClient = this.db,
  ): Promise<void> {
    await client.orm.identity.RefreshToken.create({
      ...(data.id === undefined ? {} : { id: data.id }),
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt.toISOString() as TimestampString<6>,
      ipAddress: data.ipAddress,
    });
  }

  async findRefreshTokenByHash(
    tokenHash: string,
    client: DbClient = this.db,
  ): Promise<RefreshTokenRow | null> {
    // LEARN-TODO (core, unguided): AuthRepository.findRefreshTokenByHash
    // Goal: return the refresh token row with this token_hash, or null (plan §5).
    const refreshToken = await client.orm.identity.RefreshToken.where({
      tokenHash,
    }).first();
    return refreshToken;
  }

  async revokeRefreshTokenIfActive(
    id: string,
    revocation: RefreshTokenRevocation,
    client: DbClient = this.db,
  ): Promise<boolean> {
    // LEARN-TODO (core, guided, skipped: written by Claude): AuthRepository.revokeRefreshTokenIfActive
    // 1. Target the row with this id, only while its revokedAt is still null.
    // 2. Set revokedAt to now (nowTimestamp), and the reason and replacedByToken.
    // 3. Use the ORM update that returns how many rows it changed.
    const changed = await client.orm.identity.RefreshToken.where({ id })
      .where((t) => t.revokedAt.isNull())
      .updateAndCount({
        revokedAt: nowTimestamp(),
        revokedReason: revocation.reason,
        replacedByToken: revocation.replacedByToken,
      });
    // 4. Return true when one row changed, false when none did (plan §7).
    return changed === 1;
  }

  // Reuse detection: revokes the given row and every row rotated from it, by following replaced_by_token until it is
  // null. Already revoked rows keep their first reason. Returns how many rows it revoked.
  // One query per link: a chain grows by one row per refresh, and this only runs when a token is replayed. A
  // recursive CTE would do it in one query, but the raw SQL lane isn't available on a transaction client.
  async revokeTokenChain(
    fromTokenId: string,
    reason: RevokedReason,
    client: DbClient = this.db,
  ): Promise<number> {
    let revoked = 0;
    let nextId: string | null = fromTokenId;
    while (nextId !== null) {
      const row: Pick<
        RefreshTokenRow,
        "id" | "revokedAt" | "replacedByToken"
      > | null = await client.orm.identity.RefreshToken.where({ id: nextId })
        .select("id", "revokedAt", "replacedByToken")
        .first();
      if (row === null) break;
      // Only the live end of a chain is still active: every earlier row was revoked when it was rotated.
      if (row.revokedAt === null) {
        await client.orm.identity.RefreshToken.where({ id: row.id }).update({
          revokedAt: nowTimestamp(),
          revokedReason: reason,
        });
        revoked += 1;
      }
      nextId = row.replacedByToken;
    }
    return revoked;
  }
}
