import { describe, expect, it, vi } from "vitest";
import type { PasswordHasher } from "../../../common/password-hasher.js";
import type { TransactionRunner, Tx } from "../../../prisma/db.js";
import type { CustomerProfile, CustomersService } from "../../customers/index.js";
import { EmailAlreadyExistsError, PhoneNumberInUseError } from "../auth.errors.js";
import type { AuthRepository, UserRow } from "../auth.repository.js";
import { AuthService } from "../auth.service.js";
import type { IssuedRefreshToken } from "../auth.types.js";
import type { RegisterCustomerInput } from "../auth.validation.js";
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
    createRefreshToken: vi.fn(async (): Promise<void> => undefined),
  };
  const customers = { createProfile: vi.fn(async (): Promise<CustomerProfile> => profile) };
  const hasher = { hash: vi.fn(async () => "hashed-password") };
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
});
