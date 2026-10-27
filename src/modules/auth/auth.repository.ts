import type { Scalars } from "@prisma/orm-postgres/family-contract/types";
import type { TimestampString } from "@prisma/orm-postgres/target/codec-types";
import type { Models } from "../../prisma/contract.d.js";
import type { DbClient } from "../../prisma/db.js";
import {
  EmailAlreadyExistsError,
  PhoneNumberInUseError,
  SqlQueryError,
} from "./auth.errors.js";
import type { RoleName } from "./auth.types.js";

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

export interface NewUser {
  readonly email: string;
  readonly normalizedEmail: string;
  readonly passwordHash: string;
  readonly phoneNumber: string;
}

export interface NewRefreshToken {
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly ipAddress: string | null;
}

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
      .where((u) => u.deletedAt.isNotNull())
      .first();
    // 2. Return the row, or null.
    return user;
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
      .where((u) => u.deletedAt.isNotNull())
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
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt.toISOString() as TimestampString<6>,
      ipAddress: data.ipAddress,
    });
  }
}
