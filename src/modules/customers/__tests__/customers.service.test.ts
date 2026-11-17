import { describe, expect, it, vi } from "vitest";
import { CustomerNotFoundError } from "../customers.errors.js";
import type {
  CustomersRepository,
  CustomerWithUserRow,
} from "../customers.repository.js";
import { CustomersService } from "../customers.service.js";

const USER_ID = "6f1c2a9e-4b7d-4c1a-9e2f-3a5b7c9d1e2f";

const profileRow = (
  overrides: Partial<CustomerWithUserRow> = {},
): CustomerWithUserRow =>
  ({
    id: "7d8c5e9a-8b2f-4c1a-9d72-123456789abc",
    userId: USER_ID,
    firstName: "John",
    lastName: "Doe",
    profileImageUrl: "https://cdn.example.com/profiles/7d8c5e9a.jpg",
    dateOfBirth: "1995-06-15",
    gender: "male",
    createdAt: "2024-01-15 10:30:00",
    updatedAt: null,
    user: {
      email: "john@example.com",
      phoneNumber: "+201234567890",
      emailVerifiedAt: "2024-01-16 08:00:00",
    },
    ...overrides,
  }) as CustomerWithUserRow;

const setup = (found: CustomerWithUserRow | null) => {
  const findProfileByUserId = vi.fn(
    async (_userId: string): Promise<CustomerWithUserRow | null> => found,
  );
  const service = new CustomersService({
    findProfileByUserId,
  } as unknown as CustomersRepository);
  return { service, findProfileByUserId };
};

describe("CustomersService", () => {
  describe("getProfile", () => {
    it("returns the mapped profile of the caller", async () => {
      const { service, findProfileByUserId } = setup(profileRow());

      const profile = await service.getProfile(USER_ID);

      expect(findProfileByUserId).toHaveBeenCalledExactlyOnceWith(USER_ID);
      expect(profile).toStrictEqual({
        id: "7d8c5e9a-8b2f-4c1a-9d72-123456789abc",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+201234567890",
        profileImageUrl: "https://cdn.example.com/profiles/7d8c5e9a.jpg",
        dateOfBirth: "1995-06-15",
        gender: "male",
        emailVerified: true,
        createdAt: "2024-01-15T10:30:00.000Z",
      });
    });

    it("sets emailVerified to false when the email is not verified", async () => {
      const { service } = setup(
        profileRow({
          user: {
            email: "john@example.com",
            phoneNumber: "+201234567890",
            emailVerifiedAt: null,
          },
        }),
      );

      const profile = await service.getProfile(USER_ID);

      expect(profile.emailVerified).toBe(false);
    });

    it("throws CustomerNotFoundError when no profile is found", async () => {
      const { service, findProfileByUserId } = setup(null);

      await expect(service.getProfile(USER_ID)).rejects.toThrow(CustomerNotFoundError);
      expect(findProfileByUserId).toHaveBeenCalledExactlyOnceWith(USER_ID);
    });
  });
});
