import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createAuthenticate } from "../../../middlewares/authenticate.js";
import { errorHandler } from "../../../middlewares/error-handler.js";
import { requireRole } from "../../../middlewares/require-role.js";
import { ROLE_NAMES, type AuthContext } from "../../auth/auth.types.js";
import { CustomerProfileController } from "../controllers/customer.controller.js";
import { CustomerNotFoundError } from "../customers.errors.js";
import type { CustomersService } from "../customers.service.js";
import type { CustomerProfileResponse } from "../customers.types.js";
import { buildCustomerRouter } from "../routes/customer.routes.js";

const USER_ID = "6f1c2a9e-4b7d-4c1a-9e2f-3a5b7c9d1e2f";

const profile: CustomerProfileResponse = {
  id: "7d8c5e9a-8b2f-4c1a-9d72-123456789abc",
  email: "john@example.com",
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "+201234567890",
  profileImageUrl: null,
  dateOfBirth: "1995-06-15",
  gender: "male",
  emailVerified: true,
  createdAt: "2024-01-15T10:30:00.000Z",
};

const setup = (caller: AuthContext = { userId: USER_ID, role: ROLE_NAMES.customer }) => {
  const getProfile = vi.fn(async (_userId: string): Promise<CustomerProfileResponse> => profile);
  const authenticate = vi.fn(async (_accessToken: string): Promise<AuthContext> => caller);
  const controller = new CustomerProfileController({ getProfile } as unknown as CustomersService);
  const app = express();
  app.use(
    "/customers",
    createAuthenticate({ authenticate }),
    requireRole(ROLE_NAMES.customer),
    buildCustomerRouter(controller),
  );
  app.use(errorHandler);
  return { app, getProfile, authenticate };
};

describe("GET /customers/me", () => {
  it("answers 200 with the caller's profile", async () => {
    const { app, getProfile } = setup();

    const res = await request(app).get("/customers/me").set("Authorization", "Bearer access-token");

    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({
      success: true,
      message: "Customer profile retrieved successfully",
      data: { customer: profile },
    });
    expect(getProfile).toHaveBeenCalledExactlyOnceWith(USER_ID);
  });

  it("answers 401 without a token and never reads the profile", async () => {
    const { app, getProfile } = setup();

    const res = await request(app).get("/customers/me");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_ACCESS_TOKEN");
    expect(getProfile).not.toHaveBeenCalled();
  });

  it("answers 403 for a non-customer token and never reads the profile", async () => {
    const { app, getProfile } = setup({ userId: USER_ID, role: ROLE_NAMES.driver });

    const res = await request(app).get("/customers/me").set("Authorization", "Bearer access-token");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(getProfile).not.toHaveBeenCalled();
  });

  it("answers 404 when the caller has no customer profile", async () => {
    const { app, getProfile } = setup();
    getProfile.mockRejectedValueOnce(new CustomerNotFoundError());

    const res = await request(app).get("/customers/me").set("Authorization", "Bearer access-token");

    expect(res.status).toBe(404);
    expect(res.body).toStrictEqual({
      success: false,
      message: "Customer profile not found",
      error: { code: "CUSTOMER_NOT_FOUND" },
    });
  });
});
