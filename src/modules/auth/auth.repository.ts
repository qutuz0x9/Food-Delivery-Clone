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

  // Ends a session: revokes the given row and every row rotated from it, by following replaced_by_token until it is
  // null. Used by refresh (reuse detection) and logout. Already revoked rows keep their first reason. Returns how many
  // rows it revoked. Safe when a logout or a refresh runs on the same chain at the same moment (plan §8).
  // One query per link: a chain grows by one row per refresh. A recursive CTE would do it in one query, but the raw
  // SQL lane isn't available on a transaction client.
  async revokeTokenChain(
    fromTokenId: string,
    reason: RevokedReason,
    client: DbClient = this.db,
  ): Promise<number> {
    // LEARN-TODO (core, guided, skipped: written by Claude): AuthRepository.revokeTokenChain
    // 1. Start a count at 0, and the current id at fromTokenId.
    let revoked = 0;
    let currentId: string | null = fromTokenId;
    // 2. Loop while there is a current id.
    while (currentId !== null) {
      // 3. Revoke the row by id only while its revokedAt is null (nowTimestamp, reason).
      // The condition is part of the UPDATE, so if a refresh's transaction holds this row, the update waits for it and
      // then changes nothing: an already revoked row keeps its first reason.
      const changed = await client.orm.identity.RefreshToken.where({ id: currentId })
        .where((t) => t.revokedAt.isNull())
        .updateAndCount({ revokedAt: nowTimestamp(), revokedReason: reason });
      // 4. Add the number of rows the update changed to the count.
      revoked += changed;
      // 5. After the update, read the row's replacedByToken (plan §3, step 4).
      // Read after the update, not before: after the wait above, this sees the link a parallel refresh just committed.
      const row: Pick<RefreshTokenRow, "replacedByToken"> | null =
        await client.orm.identity.RefreshToken.where({ id: currentId })
          .select("replacedByToken")
          .first();
      // 6. No row: stop. Otherwise the next id is its replacedByToken.
      if (row === null) break;
      currentId = row.replacedByToken;
    }
    // 7. Return the count.
    return revoked;
  }
}
