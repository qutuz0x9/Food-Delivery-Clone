import { describe, expect, it, vi } from "vitest";
import type { PasswordHasher } from "../../../common/password-hasher.js";
import type { TransactionRunner, Tx } from "../../../prisma/db.js";
import type { CustomerProfile, CustomersService } from "../../customers/index.js";
import {
  AccountNotActiveError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  NotACustomerError,
  PhoneNumberInUseError,
} from "../auth.errors.js";
import type { AuthRepository, NewRefreshToken, UserRow } from "../auth.repository.js";
import { AuthService } from "../auth.service.js";
import type { InactiveAccountStatus, IssuedRefreshToken } from "../auth.types.js";
import type { LoginCustomerInput, RegisterCustomerInput } from "../auth.validation.js";
import type { TokenService } from "../token.service.js";

// Input as the validate middleware hands it over: already trimmed.
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
  token: "raw-refresh-token",
  tokenHash: "refresh-token-hash",
  expiresAt: new Date("2026-10-26T10:00:00Z"),
};

// Fakes for every dependency. db.transaction calls the callback with `tx`, so the tests can check that each write
// received the transaction client.
const setup = () => {
  const tx = { label: "transaction client" } as unknown as Tx;
  const db = { transaction: vi.fn(async (callback: (client: Tx) => Promise<unknown>) => callback(tx)) };
  const authRepository = {
    findUserByNormalizedEmail: vi.fn(async (_normalizedEmail: string, _client?: unknown): Promise<UserRow | null> => null),
    findUserByPhoneNumber: vi.fn(async (_phoneNumber: string, _client?: unknown): Promise<UserRow | null> => null),
    findRoleIdByName: vi.fn(async (): Promise<string | null> => "role-customer"),
    createUser: vi.fn(async (): Promise<UserRow> => createdUser),
    assignRole: vi.fn(async (): Promise<void> => undefined),
    createRefreshToken: vi.fn(async (_data: NewRefreshToken, _client?: unknown): Promise<void> => undefined),
  };
  const customers = {
    createProfile: vi.fn(async (): Promise<CustomerProfile> => profile),
    findProfileByUserId: vi.fn(async (_userId: string): Promise<CustomerProfile | null> => profile),
  };
  const hasher = {
    hash: vi.fn(async () => "hashed-password"),
    verify: vi.fn(async (_password: string, _storedHash: string | null): Promise<boolean> => true),
  };
  const tokens = {
    createRefreshToken: vi.fn(() => refreshToken),
    signAccessToken: vi.fn(() => "access-token"),
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
      expect(authRepository.assignRole).toHaveBeenCalledWith("user-1", "role-customer", tx);
      expect(customers.createProfile).toHaveBeenCalledWith({ userId: "user-1", firstName: "John", lastName: "Doe" }, tx);
      expect(authRepository.createRefreshToken).toHaveBeenCalledWith(
        {
          userId: "user-1",
          tokenHash: "refresh-token-hash",
          expiresAt: refreshToken.expiresAt,
          ipAddress: "203.0.113.7",
        },
        tx,
      );
      expect(tokens.signAccessToken).toHaveBeenCalledWith({ userId: "user-1", role: "Customer" });
    });

    it("stores a hash of the password, never the plain password", async () => {
      const { service, authRepository, hasher } = setup();

      await service.registerCustomer(input, context);

      expect(hasher.hash).toHaveBeenCalledWith("StrongPassword123!");
      expect(JSON.stringify(authRepository.createUser.mock.calls)).not.toContain("StrongPassword123!");
    });

    it("looks the email up by its normalized form", async () => {
      const { service, authRepository } = setup();

      await service.registerCustomer(input, context);

      expect(authRepository.findUserByNormalizedEmail.mock.calls[0]?.[0]).toBe("john@example.com");
    });

    it("throws EmailAlreadyExistsError and creates nothing when the email is taken", async () => {
      const { service, authRepository, customers } = setup();
      authRepository.findUserByNormalizedEmail.mockResolvedValue(createdUser);

      await expect(service.registerCustomer(input, context)).rejects.toBeInstanceOf(EmailAlreadyExistsError);
      expect(authRepository.createUser).not.toHaveBeenCalled();
      expect(customers.createProfile).not.toHaveBeenCalled();
      expect(authRepository.createRefreshToken).not.toHaveBeenCalled();
    });

    it("throws PhoneNumberInUseError and creates nothing when the phone number is taken", async () => {
      const { service, authRepository, customers } = setup();
      authRepository.findUserByPhoneNumber.mockResolvedValue(createdUser);

      await expect(service.registerCustomer(input, context)).rejects.toBeInstanceOf(PhoneNumberInUseError);
      expect(authRepository.createUser).not.toHaveBeenCalled();
      expect(customers.createProfile).not.toHaveBeenCalled();
      expect(authRepository.createRefreshToken).not.toHaveBeenCalled();
    });

    it("fails with a plain (500) error and creates nothing when the Customer role is missing", async () => {
      const { service, authRepository } = setup();
      authRepository.findRoleIdByName.mockResolvedValue(null);

      const error: unknown = await service.registerCustomer(input, context).catch((e: unknown) => e);

      expect(authRepository.findRoleIdByName).toHaveBeenCalledWith("Customer");
      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(EmailAlreadyExistsError);
      expect(authRepository.createUser).not.toHaveBeenCalled();
    });

    it("does not sign an access token when a write in the transaction fails", async () => {
      const { service, authRepository, tokens } = setup();
      // The race: the pre-check passed, but another request inserted the same email first.
      authRepository.createUser.mockRejectedValue(new EmailAlreadyExistsError());

      await expect(service.registerCustomer(input, context)).rejects.toBeInstanceOf(EmailAlreadyExistsError);
      expect(tokens.signAccessToken).not.toHaveBeenCalled();
    });
  });
  describe("loginCustomer", () => {
    const loginInput: LoginCustomerInput = { email: "John@Example.com", password: "StrongPassword123!" };
    const asUser = (overrides: Partial<UserRow>): UserRow => ({ ...createdUser, ...overrides }) as UserRow;

    // Everything the fakes saw that could carry a token or a session: none of it may happen on a failed login.
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
      expect(tokens.signAccessToken).toHaveBeenCalledWith({ userId: "user-1", role: "Customer" });
    });

    it("looks the user up by the lowercased email and checks the password against the stored hash", async () => {
      const { service, authRepository, hasher } = setup();
      authRepository.findUserByNormalizedEmail.mockResolvedValue(createdUser);

      await service.loginCustomer(loginInput, context);

      expect(authRepository.findUserByNormalizedEmail.mock.calls[0]?.[0]).toBe("john@example.com");
      expect(hasher.verify).toHaveBeenCalledWith("StrongPassword123!", "hashed-password");
    });

    it("throws InvalidCredentialsError for an unknown email, and still runs the password check", async () => {
      const fakes = setup();
      fakes.authRepository.findUserByNormalizedEmail.mockResolvedValue(null);
      fakes.hasher.verify.mockResolvedValue(false);

      await expect(fakes.service.loginCustomer(loginInput, context)).rejects.toBeInstanceOf(InvalidCredentialsError);
      // The dummy check makes "no such email" as slow as "wrong password" (plan §8).
      expect(fakes.hasher.verify).toHaveBeenCalledWith("StrongPassword123!", null);
      expectNothingIssued(fakes);
    });

    it("throws InvalidCredentialsError for a wrong password, before looking at anything else", async () => {
      const fakes = setup();
      fakes.authRepository.findUserByNormalizedEmail.mockResolvedValue(createdUser);
      fakes.hasher.verify.mockResolvedValue(false);

      await expect(fakes.service.loginCustomer(loginInput, context)).rejects.toBeInstanceOf(InvalidCredentialsError);
      expect(fakes.customers.findProfileByUserId).not.toHaveBeenCalled();
      expectNothingIssued(fakes);
    });

    it.each<[InactiveAccountStatus, string]>([
      ["inactive", "ACCOUNT_INACTIVE"],
      ["locked", "ACCOUNT_LOCKED"],
      ["suspended", "ACCOUNT_SUSPENDED"],
    ])("throws a 403 AccountNotActiveError for a %s account with the right password", async (status, code) => {
      const fakes = setup();
      fakes.authRepository.findUserByNormalizedEmail.mockResolvedValue(asUser({ accountStatus: status }));

      const error: unknown = await fakes.service.loginCustomer(loginInput, context).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(AccountNotActiveError);
      expect(error).toMatchObject({ statusCode: 403, code });
      expectNothingIssued(fakes);
    });

    it("answers a wrong password on a suspended account with 401, not 403, so the status isn't revealed", async () => {
      const fakes = setup();
      fakes.authRepository.findUserByNormalizedEmail.mockResolvedValue(asUser({ accountStatus: "suspended" }));
      fakes.hasher.verify.mockResolvedValue(false);

      await expect(fakes.service.loginCustomer(loginInput, context)).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it("throws NotACustomerError when the account has no customer profile", async () => {
      const fakes = setup();
      fakes.authRepository.findUserByNormalizedEmail.mockResolvedValue(createdUser);
      fakes.customers.findProfileByUserId.mockResolvedValue(null);

      await expect(fakes.service.loginCustomer(loginInput, context)).rejects.toBeInstanceOf(NotACustomerError);
      expect(fakes.customers.findProfileByUserId).toHaveBeenCalledWith("user-1");
      expectNothingIssued(fakes);
    });
  });
});
