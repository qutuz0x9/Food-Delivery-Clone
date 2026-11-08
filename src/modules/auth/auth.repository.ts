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
  readonly id?: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly ipAddress: string | null;
}

export interface RefreshTokenRevocation {
  readonly reason: RevokedReason;
  readonly replacedByToken: string;
}

const nowTimestamp = (): TimestampString<6> =>
  new Date().toISOString() as TimestampString<6>;

export class AuthRepository {
  private readonly db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  async findUserByNormalizedEmail(
    normalizedEmail: string,
    client: DbClient = this.db,
  ): Promise<UserRow | null> {
    const user = await client.orm.identity.User.where({
      normalizedEmail,
    })
      .where((u) => u.deletedAt.isNull())
      .first();
    return user;
  }

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
    try {
      const user = await client.orm.identity.User.create(data);
      return user;
    } catch (error) {
      const constraint = uniqueViolationConstraint(error);
      if (
        constraint === "users_email_key" ||
        constraint === "users_normalized_email_key"
      ) {
        throw new EmailAlreadyExistsError();
      }
      if (constraint === "users_phone_number_key")
        throw new PhoneNumberInUseError();
      throw error;
    }
  }

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
    const changed = await client.orm.identity.RefreshToken.where({ id })
      .where((t) => t.revokedAt.isNull())
      .updateAndCount({
        revokedAt: nowTimestamp(),
        revokedReason: revocation.reason,
        replacedByToken: revocation.replacedByToken,
      });
    return changed === 1;
  }

  async revokeTokenChain(
    fromTokenId: string,
    reason: RevokedReason,
    client: DbClient = this.db,
  ): Promise<number> {
    let revoked = 0;
    let currentId: string | null = fromTokenId;
    while (currentId !== null) {
      // Update before reading the next link, so a refresh running in parallel can't hide a new live token.
      const changed = await client.orm.identity.RefreshToken.where({ id: currentId })
        .where((t) => t.revokedAt.isNull())
        .updateAndCount({ revokedAt: nowTimestamp(), revokedReason: reason });
      revoked += changed;
      const row: Pick<RefreshTokenRow, "replacedByToken"> | null =
        await client.orm.identity.RefreshToken.where({ id: currentId })
          .select("replacedByToken")
          .first();
      if (row === null) break;
      currentId = row.replacedByToken;
    }
    return revoked;
  }
}
