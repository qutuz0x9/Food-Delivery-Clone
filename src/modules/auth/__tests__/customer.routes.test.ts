import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../../middlewares/error-handler.js";
import { createRateLimiter } from "../../../middlewares/rate-limit.js";
import { AccountNotActiveError, EmailAlreadyExistsError, InvalidCredentialsError } from "../auth.errors.js";
import type { AuthService } from "../auth.service.js";
import type { LoginCustomerResult, RegisterCustomerResult } from "../auth.types.js";
import { CustomerAuthController } from "../controllers/customer.controller.js";
import { buildCustomerAuthRouter } from "../routes/customer.routes.js";

const validBody = {
  email: "john@example.com",
  password: "StrongPassword123!",
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "+201234567890",
};

const DAY_MS = 24 * 60 * 60 * 1000;

const registered = (): RegisterCustomerResult => ({
  customer: {
    id: "customer-1",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    phoneNumber: "+201234567890",
  },
  accessToken: "access-token",
  refreshToken: { token: "raw-refresh-token", tokenHash: "refresh-token-hash", expiresAt: new Date(Date.now() + 7 * DAY_MS) },
});

// The real router, validation, controller, rate limiter and errorHandler, with a fake AuthService: no database.
// Each setup builds a new limiter, so the attempt counts never leak from one test to the next.
const setup = ({ loginLimit = 100 }: { loginLimit?: number } = {}) => {
  const registerCustomer = vi.fn(async (): Promise<RegisterCustomerResult> => registered());
  const loginCustomer = vi.fn(async (): Promise<LoginCustomerResult> => registered());
  const controller = new CustomerAuthController({ registerCustomer, loginCustomer } as unknown as AuthService, {
    secure: false,
    path: "/api/v1/auth",
  });
  const app = express();
  app.use(express.json());
  app.use(
    "/api/v1/auth",
    buildCustomerAuthRouter(controller, createRateLimiter({ windowMs: 60_000, limit: loginLimit })),
  );
  app.use(errorHandler);
  return { app, registerCustomer, loginCustomer };
};

describe("POST /api/v1/auth/register/customer", () => {
  it("returns 201 with the customer and access token, and the refresh token only in a safe cookie", async () => {
    const { app, registerCustomer } = setup();

    const res = await request(app).post("/api/v1/auth/register/customer").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      message: "Customer account created successfully",
      data: { customer: registered().customer, accessToken: "access-token" },
    });
    expect(res.text).not.toContain("raw-refresh-token");
    expect(registerCustomer).toHaveBeenCalledWith(validBody, { ipAddress: expect.any(String) });

    const cookie = res.headers["set-cookie"]?.[0] ?? "";
    expect(cookie).toMatch(/^refreshToken=raw-refresh-token;/);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Path=/api/v1/auth");
    expect(cookie).toMatch(/Max-Age=60479\d|Max-Age=604800/);
  });

  it("returns 400 VALIDATION_ERROR for an invalid email and does not call the service", async () => {
    const { app, registerCustomer } = setup();

    const res = await request(app)
      .post("/api/v1/auth/register/customer")
      .send({ ...validBody, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(res.body.error.fields)).toEqual(["email"]);
    expect(registerCustomer).not.toHaveBeenCalled();
  });

  it("returns 400 with every field listed when the body is empty", async () => {
    const { app } = setup();

    const res = await request(app).post("/api/v1/auth/register/customer").send({});

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.fields).sort()).toEqual(["email", "firstName", "lastName", "password", "phoneNumber"]);
  });

  it("returns 409 EMAIL_ALREADY_EXISTS when the service throws EmailAlreadyExistsError", async () => {
    const { app, registerCustomer } = setup();
    registerCustomer.mockRejectedValue(new EmailAlreadyExistsError());

    const res = await request(app).post("/api/v1/auth/register/customer").send(validBody);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      message: "Email address is already registered",
      error: { code: "EMAIL_ALREADY_EXISTS" },
    });
    expect(res.headers["set-cookie"]).toBeUndefined();
  });
});

describe("POST /api/v1/auth/login/customer", () => {
  const loginBody = { email: "john@example.com", password: "StrongPassword123!" };

  it("returns 200 with the customer and access token, and the refresh token only in a safe cookie", async () => {
    const { app, loginCustomer } = setup();

    const res = await request(app).post("/api/v1/auth/login/customer").send(loginBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Logged in successfully",
      data: { customer: registered().customer, accessToken: "access-token" },
    });
    expect(res.text).not.toContain("raw-refresh-token");
    expect(loginCustomer).toHaveBeenCalledWith(loginBody, { ipAddress: expect.any(String) });

    const cookie = res.headers["set-cookie"]?.[0] ?? "";
    expect(cookie).toMatch(/^refreshToken=raw-refresh-token;/);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Path=/api/v1/auth");
  });

  it("returns 400 VALIDATION_ERROR for an invalid email and does not call the service", async () => {
    const { app, loginCustomer } = setup();

    const res = await request(app)
      .post("/api/v1/auth/login/customer")
      .send({ ...loginBody, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(res.body.error.fields)).toEqual(["email"]);
    expect(loginCustomer).not.toHaveBeenCalled();
  });

  it("returns 401 INVALID_CREDENTIALS and no cookie when the service rejects the credentials", async () => {
    const { app, loginCustomer } = setup();
    loginCustomer.mockRejectedValue(new InvalidCredentialsError());

    const res = await request(app).post("/api/v1/auth/login/customer").send(loginBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      message: "Invalid email or password",
      error: { code: "INVALID_CREDENTIALS" },
    });
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("returns 403 with the account status code for a suspended account", async () => {
    const { app, loginCustomer } = setup();
    loginCustomer.mockRejectedValue(new AccountNotActiveError("suspended"));

    const res = await request(app).post("/api/v1/auth/login/customer").send(loginBody);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      success: false,
      message: "This account has been suspended",
      error: { code: "ACCOUNT_SUSPENDED" },
    });
  });

  it("returns 429 TOO_MANY_REQUESTS with Retry-After once the IP is over the limit", async () => {
    const { app, loginCustomer } = setup({ loginLimit: 2 });

    await request(app).post("/api/v1/auth/login/customer").send(loginBody);
    await request(app).post("/api/v1/auth/login/customer").send(loginBody);
    const res = await request(app).post("/api/v1/auth/login/customer").send(loginBody);

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      success: false,
      message: "Too many attempts. Please try again later",
      error: { code: "TOO_MANY_REQUESTS" },
    });
    expect(res.headers["retry-after"]).toEqual(expect.any(String));
    expect(loginCustomer).toHaveBeenCalledTimes(2);
  });
});
