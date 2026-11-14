import type { TimestampString } from "@prisma/orm-postgres/target/codec-types";
import { describe, expect, it, vi } from "vitest";
import type { PasswordHasher } from "../../../common/password-hasher.js";
import type { TransactionRunner, Tx } from "../../../prisma/db.js";
import type {
  CustomerProfile,
  CustomersService,
} from "../../customers/index.js";
import {
  AccessTokenExpiredError,
  AccountNotActiveError,
  EmailAlreadyExistsError,
  InvalidAccessTokenError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  NotACustomerError,
  PhoneNumberInUseError,
} from "../auth.errors.js";
import type {
  AuthRepository,
  NewRefreshToken,
  RefreshTokenRevocation,
  RefreshTokenRow,
  UserRow,
} from "../auth.repository.js";
import { AuthService } from "../auth.service.js";
import {
  REVOKED_REASONS,
  ROLE_NAMES,
  type InactiveAccountStatus,
  type IssuedRefreshToken,
  type RevokedReason,
} from "../auth.types.js";
import type {
  LoginCustomerInput,
  RegisterCustomerInput,
} from "../auth.validation.js";
import type { AccessTokenClaims, TokenService } from "../token.service.js";

const input: RegisterCustomerInput = {
  email: "John@Example.com",
  password: "StrongPassword123!",
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "+201234567890",
};
const context = { ipAddress: "203.0.113.7" };

const createdUser = {
  id: "user-1",
  email: "John@Example.com",
  normalizedEmail: "john@example.com",
  passwordHash: "hashed-password",
  phoneNumber: "+201234567890",
  emailVerifiedAt: null,
  phoneVerifiedAt: null,
  accountStatus: "active",
  createdAt: "2026-10-19 10:00:00",
  updatedAt: null,
  deletedAt: null,
} as UserRow;

const profile = {
  id: "customer-1",
  userId: "user-1",
  firstName: "John",
  lastName: "Doe",
  profileImageUrl: null,
  dateOfBirth: null,
  gender: null,
  createdAt: "2026-10-19 10:00:00",
  updatedAt: null,
} as CustomerProfile;

const refreshToken: IssuedRefreshToken = {
  id: "token-new",
  token: "raw-refresh-token",
  tokenHash: "refresh-token-hash",
  expiresAt: new Date("2026-10-26T10:00:00Z"),
};

const DAY_MS = 24 * 60 * 60 * 1000;
const asTimestamp = (date: Date): TimestampString<6> =>
  date.toISOString().replace("T", " ").replace("Z", "") as TimestampString<6>;
const storedToken = (
  overrides: Partial<RefreshTokenRow> = {},
): RefreshTokenRow =>
  ({
    id: "token-old",
    userId: "user-1",
    tokenHash: "old-token-hash",
    expiresAt: asTimestamp(new Date(Date.now() + 7 * DAY_MS)),
    createdAt: asTimestamp(new Date(Date.now() - DAY_MS)),
    revokedAt: null,
    replacedByToken: null,
    revokedReason: null,
    deviceId: null,
    ipAddress: "203.0.113.7",
    ...overrides,
  }) as RefreshTokenRow;

const setup = () => {
  const tx = { label: "transaction client" } as unknown as Tx;
  const db = {
    transaction: vi.fn(async (callback: (client: Tx) => Promise<unknown>) =>
      callback(tx),
    ),
  };
  const authRepository = {
    findUserByNormalizedEmail: vi.fn(
      async (
        _normalizedEmail: string,
        _client?: unknown,
      ): Promise<UserRow | null> => null,
    ),
    findUserByPhoneNumber: vi.fn(
      async (
        _phoneNumber: string,
        _client?: unknown,
      ): Promise<UserRow | null> => null,
    ),
    findRoleIdByName: vi.fn(
      async (): Promise<string | null> => "role-customer",
    ),
    createUser: vi.fn(async (): Promise<UserRow> => createdUser),
    assignRole: vi.fn(async (): Promise<void> => undefined),
    createRefreshToken: vi.fn(
      async (_data: NewRefreshToken, _client?: unknown): Promise<void> =>
        undefined,
    ),
    findRefreshTokenByHash: vi.fn(
      async (
        _tokenHash: string,
        _client?: unknown,
      ): Promise<RefreshTokenRow | null> => null,
    ),
    revokeRefreshTokenIfActive: vi.fn(
      async (
        _id: string,
        _revocation: RefreshTokenRevocation,
        _client?: unknown,
      ): Promise<boolean> => true,
    ),
    revokeTokenChain: vi.fn(
      async (
        _fromTokenId: string,
        _reason: RevokedReason,
        _client?: unknown,
      ): Promise<number> => 1,
    ),
    findUserById: vi.fn(
      async (_id: string, _client?: unknown): Promise<UserRow | null> =>
        createdUser,
    ),
  };
  const customers = {
    createProfile: vi.fn(async (): Promise<CustomerProfile> => profile),
    findProfileByUserId: vi.fn(
      async (_userId: string): Promise<CustomerProfile | null> => profile,
    ),
  };
  const hasher = {
    hash: vi.fn(async () => "hashed-password"),
    verify: vi.fn(
      async (_password: string, _storedHash: string | null): Promise<boolean> =>
        true,
    ),
  };
  const tokens = {
    createRefreshToken: vi.fn(() => refreshToken),
    signAccessToken: vi.fn(() => "access-token"),
    hashRefreshToken: vi.fn((_token: string) => "old-token-hash"),
    verifyAccessToken: vi.fn((_token: string): AccessTokenClaims => ({
      userId: "user-1",
      role: ROLE_NAMES.customer,
    })),
  };
  const service = new AuthService(
    db as unknown as TransactionRunner,
    authRepository as unknown as AuthRepository,
    customers as unknown as CustomersService,
    hasher as unknown as PasswordHasher,
    tokens as unknown as TokenService,
  );
  return { service, tx, db, authRepository, customers, hasher, tokens };
};

describe("AuthService", () => {
  describe("registerCustomer", () => {
    it("creates the user, role, profile and refresh token in one transaction and returns the tokens", async () => {
      const { service, tx, db, authRepository, customers, tokens } = setup();

      const result = await service.registerCustomer(input, context);

      expect(result).toEqual({
        customer: {
          id: "customer-1",
          email: "John@Example.com",
          firstName: "John",
          lastName: "Doe",
          phoneNumber: "+201234567890",
        },
        accessToken: "access-token",
        refreshToken,
      });
      expect(db.transaction).toHaveBeenCalledTimes(1);
      expect(authRepository.createUser).toHaveBeenCalledWith(
        {
          email: "John@Example.com",
          normalizedEmail: "john@example.com",
          passwordHash: "hashed-password",
          phoneNumber: "+201234567890",
        },
        tx,
      );
      expect(authRepository.assignRole).toHaveBeenCalledWith(
        "user-1",
        "role-customer",
        tx,
      );
      expect(customers.createProfile).toHaveBeenCalledWith(
        { userId: "user-1", firstName: "John", lastName: "Doe" },
        tx,
      );
      expect(authRepository.createRefreshToken).toHaveBeenCalledWith(
        {
          userId: "user-1",
          tokenHash: "refresh-token-hash",
          expiresAt: refreshToken.expiresAt,
          ipAddress: "203.0.113.7",
        },
        tx,
      );
      expect(tokens.signAccessToken).toHaveBeenCalledWith({
        userId: "user-1",
        role: "Customer",
      });
    });

    it("stores a hash of the password, never the plain password", async () => {
      const { service, authRepository, hasher } = setup();

      await service.registerCustomer(input, context);

      expect(hasher.hash).toHaveBeenCalledWith("StrongPassword123!");
      expect(
        JSON.stringify(authRepository.createUser.mock.calls),
      ).not.toContain("StrongPassword123!");
    });

    it("looks the email up by its normalized form", async () => {
      const { service, authRepository } = setup();

      await service.registerCustomer(input, context);

      expect(authRepository.findUserByNormalizedEmail.mock.calls[0]?.[0]).toBe(
        "john@example.com",
      );
    });

    it("throws EmailAlreadyExistsError and creates nothing when the email is taken", async () => {
      const { service, authRepository, customers } = setup();
      authRepository.findUserByNormalizedEmail.mockResolvedValue(createdUser);

      await expect(
        service.registerCustomer(input, context),
      ).rejects.toBeInstanceOf(EmailAlreadyExistsError);
      expect(authRepository.createUser).not.toHaveBeenCalled();
      expect(customers.createProfile).not.toHaveBeenCalled();
      expect(authRepository.createRefreshToken).not.toHaveBeenCalled();
    });

    it("throws PhoneNumberInUseError and creates nothing when the phone number is taken", async () => {
      const { service, authRepository, customers } = setup();
      authRepository.findUserByPhoneNumber.mockResolvedValue(createdUser);

      await expect(
        service.registerCustomer(input, context),
      ).rejects.toBeInstanceOf(PhoneNumberInUseError);
      expect(authRepository.createUser).not.toHaveBeenCalled();
      expect(customers.createProfile).not.toHaveBeenCalled();
      expect(authRepository.createRefreshToken).not.toHaveBeenCalled();
    });

    it("fails with a plain (500) error and creates nothing when the Customer role is missing", async () => {
      const { service, authRepository } = setup();
      authRepository.findRoleIdByName.mockResolvedValue(null);

      const error: unknown = await service
        .registerCustomer(input, context)
        .catch((e: unknown) => e);

      expect(authRepository.findRoleIdByName).toHaveBeenCalledWith("Customer");
      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(EmailAlreadyExistsError);
      expect(authRepository.createUser).not.toHaveBeenCalled();
    });

    it("does not sign an access token when a write in the transaction fails", async () => {
      const { service, authRepository, tokens } = setup();
      authRepository.createUser.mockRejectedValue(
        new EmailAlreadyExistsError(),
      );

      await expect(
        service.registerCustomer(input, context),
      ).rejects.toBeInstanceOf(EmailAlreadyExistsError);
      expect(tokens.signAccessToken).not.toHaveBeenCalled();
    });
  });
  describe("loginCustomer", () => {
    const loginInput: LoginCustomerInput = {
      email: "John@Example.com",
      password: "StrongPassword123!",
    };
    const asUser = (overrides: Partial<UserRow>): UserRow =>
      ({ ...createdUser, ...overrides }) as UserRow;

    const expectNothingIssued = (fakes: ReturnType<typeof setup>): void => {
      expect(fakes.authRepository.createRefreshToken).not.toHaveBeenCalled();
      expect(fakes.tokens.signAccessToken).not.toHaveBeenCalled();
    };

    it("returns the customer and both tokens, and saves the refresh token's hash with the ip address", async () => {
      const { service, authRepository, tokens } = setup();
      authRepository.findUserByNormalizedEmail.mockResolvedValue(createdUser);

      const result = await service.loginCustomer(loginInput, context);

      expect(result).toEqual({
        customer: {
          id: "customer-1",
          email: "John@Example.com",
          firstName: "John",
          lastName: "Doe",
          phoneNumber: "+201234567890",
        },
        accessToken: "access-token",
        refreshToken,
      });
      expect(authRepository.createRefreshToken).toHaveBeenCalledTimes(1);
      expect(authRepository.createRefreshToken.mock.calls[0]?.[0]).toEqual({
        userId: "user-1",
        tokenHash: "refresh-token-hash",
        expiresAt: refreshToken.expiresAt,
        ipAddress: "203.0.113.7",
      });
      expect(tokens.signAccessToken).toHaveBeenCalledWith({
        userId: "user-1",
        role: "Customer",
      });
    });

    it("looks the user up by the lowercased email and checks the password against the stored hash", async () => {
      const { service, authRepository, hasher } = setup();
      authRepository.findUserByNormalizedEmail.mockResolvedValue(createdUser);

      await service.loginCustomer(loginInput, context);

      expect(authRepository.findUserByNormalizedEmail.mock.calls[0]?.[0]).toBe(
        "john@example.com",
      );
      expect(hasher.verify).toHaveBeenCalledWith(
        "StrongPassword123!",
        "hashed-password",
      );
    });

    it("throws InvalidCredentialsError for an unknown email, and still runs the password check", async () => {
      const fakes = setup();
      fakes.authRepository.findUserByNormalizedEmail.mockResolvedValue(null);
      fakes.hasher.verify.mockResolvedValue(false);

      await expect(
        fakes.service.loginCustomer(loginInput, context),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
      expect(fakes.hasher.verify).toHaveBeenCalledWith(
        "StrongPassword123!",
        null,
      );
      expectNothingIssued(fakes);
    });

    it("throws InvalidCredentialsError for a wrong password, before looking at anything else", async () => {
      const fakes = setup();
      fakes.authRepository.findUserByNormalizedEmail.mockResolvedValue(
        createdUser,
      );
      fakes.hasher.verify.mockResolvedValue(false);

      await expect(
        fakes.service.loginCustomer(loginInput, context),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
      expect(fakes.customers.findProfileByUserId).not.toHaveBeenCalled();
      expectNothingIssued(fakes);
    });

    it.each<[InactiveAccountStatus, string]>([
      ["inactive", "ACCOUNT_INACTIVE"],
      ["locked", "ACCOUNT_LOCKED"],
      ["suspended", "ACCOUNT_SUSPENDED"],
    ])(
      "throws a 403 AccountNotActiveError for a %s account with the right password",
      async (status, code) => {
        const fakes = setup();
        fakes.authRepository.findUserByNormalizedEmail.mockResolvedValue(
          asUser({ accountStatus: status }),
        );

        const error: unknown = await fakes.service
          .loginCustomer(loginInput, context)
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(AccountNotActiveError);
        expect(error).toMatchObject({ statusCode: 403, code });
        expectNothingIssued(fakes);
      },
    );

    it("answers a wrong password on a suspended account with 401, not 403, so the status isn't revealed", async () => {
      const fakes = setup();
      fakes.authRepository.findUserByNormalizedEmail.mockResolvedValue(
        asUser({ accountStatus: "suspended" }),
      );
      fakes.hasher.verify.mockResolvedValue(false);

      await expect(
        fakes.service.loginCustomer(loginInput, context),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it("throws NotACustomerError when the account has no customer profile", async () => {
      const fakes = setup();
      fakes.authRepository.findUserByNormalizedEmail.mockResolvedValue(
        createdUser,
      );
      fakes.customers.findProfileByUserId.mockResolvedValue(null);

      await expect(
        fakes.service.loginCustomer(loginInput, context),
      ).rejects.toBeInstanceOf(NotACustomerError);
      expect(fakes.customers.findProfileByUserId).toHaveBeenCalledWith(
        "user-1",
      );
      expectNothingIssued(fakes);
    });
  });

  describe("refreshCustomer", () => {
    const asUser = (overrides: Partial<UserRow>): UserRow =>
      ({ ...createdUser, ...overrides }) as UserRow;

    const expectNoRotation = (fakes: ReturnType<typeof setup>): void => {
      expect(
        fakes.authRepository.revokeRefreshTokenIfActive,
      ).not.toHaveBeenCalled();
      expect(fakes.authRepository.createRefreshToken).not.toHaveBeenCalled();
      expect(fakes.tokens.signAccessToken).not.toHaveBeenCalled();
    };

    const invalidRefresh = async (
      promise: Promise<unknown>,
    ): Promise<InvalidRefreshTokenError> => {
      const error: unknown = await promise.catch((e: unknown) => e);
      expect(error).toBeInstanceOf(InvalidRefreshTokenError);
      return error as InvalidRefreshTokenError;
    };

    it.each([undefined, ""])(
      "throws InvalidRefreshTokenError (missing) when the token is %j",
      async (token) => {
        const fakes = setup();

        const error = await invalidRefresh(
          fakes.service.refreshCustomer(token, context),
        );

        expect(error).toMatchObject({
          statusCode: 401,
          code: "INVALID_REFRESH_TOKEN",
          message: "Refresh token is required",
        });
        expect(
          fakes.authRepository.findRefreshTokenByHash,
        ).not.toHaveBeenCalled();
        expectNoRotation(fakes);
      },
    );

    it("looks the row up by the hash of the token, never by the raw token", async () => {
      const fakes = setup();
      fakes.authRepository.findRefreshTokenByHash.mockResolvedValue(
        storedToken(),
      );

      await fakes.service.refreshCustomer("raw-old-token", context);

      expect(fakes.tokens.hashRefreshToken).toHaveBeenCalledWith(
        "raw-old-token",
      );
      expect(
        fakes.authRepository.findRefreshTokenByHash.mock.calls[0]?.[0],
      ).toBe("old-token-hash");
    });

    it("throws InvalidRefreshTokenError when no row has the token's hash", async () => {
      const fakes = setup();

      const error = await invalidRefresh(
        fakes.service.refreshCustomer("raw-old-token", context),
      );

      expect(error.message).toBe(
        "Your session has expired. Please log in again",
      );
      expect(fakes.authRepository.revokeTokenChain).not.toHaveBeenCalled();
      expectNoRotation(fakes);
    });

    it("revokes the chain and throws InvalidRefreshTokenError when the token was already revoked", async () => {
      const fakes = setup();
      fakes.authRepository.findRefreshTokenByHash.mockResolvedValue(
        storedToken({
          revokedAt: asTimestamp(new Date(Date.now() - 60_000)),
          replacedByToken: "token-newer",
          revokedReason: "rotated",
        }),
      );

      const error = await invalidRefresh(
        fakes.service.refreshCustomer("raw-old-token", context),
      );

      expect(error).toMatchObject({
        statusCode: 401,
        code: "INVALID_REFRESH_TOKEN",
      });
      expect(fakes.authRepository.revokeTokenChain).toHaveBeenCalledTimes(1);
      expect(
        fakes.authRepository.revokeTokenChain.mock.calls[0]?.slice(0, 2),
      ).toEqual(["token-old", REVOKED_REASONS.reuseDetected]);
      expectNoRotation(fakes);
      expect(fakes.authRepository.findUserById).not.toHaveBeenCalled();
    });

    it("checks revoked before expired, so replaying an old expired token still revokes the chain", async () => {
      const fakes = setup();
      fakes.authRepository.findRefreshTokenByHash.mockResolvedValue(
        storedToken({
          revokedAt: asTimestamp(new Date(Date.now() - 20 * DAY_MS)),
          expiresAt: asTimestamp(new Date(Date.now() - DAY_MS)),
        }),
      );

      await invalidRefresh(
        fakes.service.refreshCustomer("raw-old-token", context),
      );

      expect(fakes.authRepository.revokeTokenChain).toHaveBeenCalledTimes(1);
    });

    it("throws InvalidRefreshTokenError when the token has expired, without revoking anything", async () => {
      const fakes = setup();
      fakes.authRepository.findRefreshTokenByHash.mockResolvedValue(
        storedToken({ expiresAt: asTimestamp(new Date(Date.now() - 60_000)) }),
      );

      await invalidRefresh(
        fakes.service.refreshCustomer("raw-old-token", context),
      );

      expect(fakes.authRepository.revokeTokenChain).not.toHaveBeenCalled();
      expect(fakes.authRepository.findUserById).not.toHaveBeenCalled();
      expectNoRotation(fakes);
    });

    it("reads expiresAt as UTC: a token that expires in an hour still works in a time zone ahead of UTC", async () => {
      const fakes = setup();
      fakes.authRepository.findRefreshTokenByHash.mockResolvedValue(
        storedToken({
          expiresAt: asTimestamp(new Date(Date.now() + 60 * 60_000)),
        }),
      );
      const originalTz = process.env["TZ"];
      process.env["TZ"] = "Asia/Tokyo";
      try {
        await expect(
          fakes.service.refreshCustomer("raw-old-token", context),
        ).resolves.toBeDefined();
      } finally {
        if (originalTz === undefined) delete process.env["TZ"];
        else process.env["TZ"] = originalTz;
      }
    });

    it("throws InvalidRefreshTokenError when the token's user is missing or soft-deleted", async () => {
      const fakes = setup();
      fakes.authRepository.findRefreshTokenByHash.mockResolvedValue(
        storedToken(),
      );
      fakes.authRepository.findUserById.mockResolvedValue(null);

      await invalidRefresh(
        fakes.service.refreshCustomer("raw-old-token", context),
      );

      expect(fakes.authRepository.findUserById.mock.calls[0]?.[0]).toBe(
        "user-1",
      );
      expectNoRotation(fakes);
    });

    it.each<[InactiveAccountStatus, string]>([
      ["inactive", "ACCOUNT_INACTIVE"],
      ["locked", "ACCOUNT_LOCKED"],
      ["suspended", "ACCOUNT_SUSPENDED"],
    ])(
      "throws a 403 AccountNotActiveError for a %s account",
      async (status, code) => {
        const fakes = setup();
        fakes.authRepository.findRefreshTokenByHash.mockResolvedValue(
          storedToken(),
        );
        fakes.authRepository.findUserById.mockResolvedValue(
          asUser({ accountStatus: status }),
        );

        const error: unknown = await fakes.service
          .refreshCustomer("raw-old-token", context)
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(AccountNotActiveError);
        expect(error).toMatchObject({ statusCode: 403, code });
        expectNoRotation(fakes);
      },
    );

    it("throws NotACustomerError when the token's user has no customer profile", async () => {
      const fakes = setup();
      fakes.authRepository.findRefreshTokenByHash.mockResolvedValue(
        storedToken(),
      );
      fakes.customers.findProfileByUserId.mockResolvedValue(null);

      await expect(
        fakes.service.refreshCustomer("raw-old-token", context),
      ).rejects.toBeInstanceOf(NotACustomerError);
      expect(fakes.customers.findProfileByUserId).toHaveBeenCalledWith(
        "user-1",
      );
      expectNoRotation(fakes);
    });

    it("revokes the old row and inserts the new one in one transaction, linked by the new id", async () => {
      const { service, tx, db, authRepository } = setup();
      authRepository.findRefreshTokenByHash.mockResolvedValue(storedToken());

      await service.refreshCustomer("raw-old-token", context);

      expect(db.transaction).toHaveBeenCalledTimes(1);
      expect(authRepository.revokeRefreshTokenIfActive).toHaveBeenCalledWith(
        "token-old",
        { reason: "rotated", replacedByToken: "token-new" },
        tx,
      );
      expect(authRepository.createRefreshToken).toHaveBeenCalledWith(
        {
          id: "token-new",
          userId: "user-1",
          tokenHash: "refresh-token-hash",
          expiresAt: refreshToken.expiresAt,
          ipAddress: "203.0.113.7",
        },
        tx,
      );
      const revokeOrder =
        authRepository.revokeRefreshTokenIfActive.mock.invocationCallOrder[0] ??
        0;
      const insertOrder =
        authRepository.createRefreshToken.mock.invocationCallOrder[0] ?? 0;
      expect(revokeOrder).toBeLessThan(insertOrder);
      expect(authRepository.revokeTokenChain).not.toHaveBeenCalled();
    });

    it("returns a new access token and the new refresh token", async () => {
      const { service, authRepository, tokens } = setup();
      authRepository.findRefreshTokenByHash.mockResolvedValue(storedToken());

      const result = await service.refreshCustomer("raw-old-token", context);

      expect(result).toEqual({ accessToken: "access-token", refreshToken });
      expect(tokens.signAccessToken).toHaveBeenCalledWith({
        userId: "user-1",
        role: "Customer",
      });
    });

    it("revokes the chain and inserts nothing when another request rotated the token first", async () => {
      const fakes = setup();
      fakes.authRepository.findRefreshTokenByHash.mockResolvedValue(
        storedToken(),
      );
      fakes.authRepository.revokeRefreshTokenIfActive.mockResolvedValue(false);

      await invalidRefresh(
        fakes.service.refreshCustomer("raw-old-token", context),
      );

      expect(fakes.authRepository.createRefreshToken).not.toHaveBeenCalled();
      expect(fakes.authRepository.revokeTokenChain).toHaveBeenCalledTimes(1);
      expect(
        fakes.authRepository.revokeTokenChain.mock.calls[0]?.slice(0, 2),
      ).toEqual(["token-old", "reuse_detected"]);
      expect(fakes.tokens.signAccessToken).not.toHaveBeenCalled();
    });

    it("does not sign an access token when a write in the transaction fails", async () => {
      const fakes = setup();
      fakes.authRepository.findRefreshTokenByHash.mockResolvedValue(
        storedToken(),
      );
      fakes.authRepository.createRefreshToken.mockRejectedValue(
        new Error("connection lost"),
      );

      await expect(
        fakes.service.refreshCustomer("raw-old-token", context),
      ).rejects.toThrow("connection lost");
      expect(fakes.tokens.signAccessToken).not.toHaveBeenCalled();
    });
  });

  describe("authenticate", () => {
    const asUser = (overrides: Partial<UserRow>): UserRow =>
      ({ ...createdUser, ...overrides }) as UserRow;

    it("verifies the token, looks the user up by the token's userId and returns the caller", async () => {
      const fakes = setup();

      await expect(
        fakes.service.authenticate("raw-access-token"),
      ).resolves.toEqual({
        userId: "user-1",
        role: ROLE_NAMES.customer,
      });
      expect(fakes.tokens.verifyAccessToken).toHaveBeenCalledWith(
        "raw-access-token",
      );
      expect(fakes.authRepository.findUserById.mock.calls[0]?.[0]).toBe(
        "user-1",
      );
    });

    it("takes the role from the token", async () => {
      const fakes = setup();
      fakes.tokens.verifyAccessToken.mockReturnValue({
        userId: "user-1",
        role: ROLE_NAMES.driver,
      });

      await expect(
        fakes.service.authenticate("raw-access-token"),
      ).resolves.toEqual({
        userId: "user-1",
        role: ROLE_NAMES.driver,
      });
    });

    it.each([
      ["invalid", new InvalidAccessTokenError()],
      ["expired", new AccessTokenExpiredError()],
    ])(
      "rethrows the token error unchanged and reads no user when the token is %s",
      async (_case, tokenError) => {
        const fakes = setup();
        fakes.tokens.verifyAccessToken.mockImplementation(() => {
          throw tokenError;
        });

        await expect(
          fakes.service.authenticate("raw-access-token"),
        ).rejects.toBe(tokenError);
        expect(fakes.authRepository.findUserById).not.toHaveBeenCalled();
      },
    );

    it("throws a 401 InvalidAccessTokenError when the token's user is missing or soft-deleted", async () => {
      const fakes = setup();
      fakes.authRepository.findUserById.mockResolvedValue(null);

      const error: unknown = await fakes.service
        .authenticate("raw-access-token")
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(InvalidAccessTokenError);
      expect(error).toMatchObject({
        statusCode: 401,
        code: "INVALID_ACCESS_TOKEN",
        message: "Access token is invalid",
      });
    });

    it.each<[InactiveAccountStatus, string]>([
      ["inactive", "ACCOUNT_INACTIVE"],
      ["locked", "ACCOUNT_LOCKED"],
    ])(
      "throws a 403 AccountNotActiveError for a %s account",
      async (status, code) => {
        const fakes = setup();
        fakes.authRepository.findUserById.mockResolvedValue(
          asUser({ accountStatus: status }),
        );

        const error: unknown = await fakes.service
          .authenticate("raw-access-token")
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(AccountNotActiveError);
        expect(error).toMatchObject({ statusCode: 403, code });
      },
    );

    it("throws a 403 AccountNotActiveError with code ACCOUNT_SUSPENDED for a suspended account", async () => {
      const fakes = setup();
      fakes.authRepository.findUserById.mockResolvedValue(
        asUser({ accountStatus: "suspended" }),
      );

      const error: unknown = await fakes.service
        .authenticate("raw-access-token")
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(AccountNotActiveError);
      expect(error).toMatchObject({
        statusCode: 403,
        code: "ACCOUNT_SUSPENDED",
        message: "This account has been suspended",
      });
    });

    it("rethrows a database error unchanged, so it becomes a 500", async () => {
      const fakes = setup();
      fakes.authRepository.findUserById.mockRejectedValue(
        new Error("connection lost"),
      );

      await expect(
        fakes.service.authenticate("raw-access-token"),
      ).rejects.toThrow("connection lost");
    });
  });

  describe("logoutCustomer", () => {
    const expectNoUserChecks = (fakes: ReturnType<typeof setup>): void => {
      expect(fakes.authRepository.findUserById).not.toHaveBeenCalled();
      expect(fakes.customers.findProfileByUserId).not.toHaveBeenCalled();
    };

    it.each([undefined, ""])(
      "resolves and looks nothing up when the token is %j",
      async (token) => {
        const fakes = setup();

        await expect(
          fakes.service.logoutCustomer(token),
        ).resolves.toBeUndefined();
        expect(fakes.tokens.hashRefreshToken).not.toHaveBeenCalled();
        expect(
          fakes.authRepository.findRefreshTokenByHash,
        ).not.toHaveBeenCalled();
        expect(fakes.authRepository.revokeTokenChain).not.toHaveBeenCalled();
      },
    );

    it("resolves and revokes nothing when no row has the token's hash", async () => {
      const fakes = setup();

      await expect(
        fakes.service.logoutCustomer("unknown-raw-token"),
      ).resolves.toBeUndefined();

      expect(fakes.authRepository.findRefreshTokenByHash).toHaveBeenCalledTimes(
        1,
      );
      expect(fakes.authRepository.revokeTokenChain).not.toHaveBeenCalled();
    });

    it("looks the row up by the token's hash and revokes its chain with reason logout, outside a transaction", async () => {
      const fakes = setup();
      fakes.authRepository.findRefreshTokenByHash.mockResolvedValue(
        storedToken(),
      );

      await expect(
        fakes.service.logoutCustomer("raw-old-token"),
      ).resolves.toBeUndefined();

      expect(fakes.tokens.hashRefreshToken).toHaveBeenCalledWith(
        "raw-old-token",
      );
      expect(
        fakes.authRepository.findRefreshTokenByHash.mock.calls[0]?.[0],
      ).toBe("old-token-hash");
      expect(fakes.authRepository.revokeTokenChain).toHaveBeenCalledTimes(1);
      expect(
        fakes.authRepository.revokeTokenChain.mock.calls[0]?.slice(0, 2),
      ).toEqual(["token-old", "logout"]);
      expect(fakes.db.transaction).not.toHaveBeenCalled();
      expectNoUserChecks(fakes);
    });

    it.each([
      [
        "already rotated",
        {
          revokedAt: asTimestamp(new Date(Date.now() - DAY_MS)),
          replacedByToken: "token-next",
          revokedReason: "rotated",
        },
      ],
      ["expired", { expiresAt: asTimestamp(new Date(Date.now() - DAY_MS)) }],
    ])(
      "still revokes the chain when the token is %s, without checking the user",
      async (_state, overrides) => {
        const fakes = setup();
        fakes.authRepository.findRefreshTokenByHash.mockResolvedValue(
          storedToken(overrides),
        );

        await expect(
          fakes.service.logoutCustomer("raw-old-token"),
        ).resolves.toBeUndefined();

        expect(
          fakes.authRepository.revokeTokenChain.mock.calls[0]?.slice(0, 2),
        ).toEqual(["token-old", "logout"]);
        expectNoUserChecks(fakes);
      },
    );

    it("rethrows a database error unchanged, so it becomes a 500", async () => {
      const fakes = setup();
      fakes.authRepository.findRefreshTokenByHash.mockResolvedValue(
        storedToken(),
      );
      fakes.authRepository.revokeTokenChain.mockRejectedValue(
        new Error("connection lost"),
      );

      await expect(
        fakes.service.logoutCustomer("raw-old-token"),
      ).rejects.toThrow("connection lost");
    });
  });
});
