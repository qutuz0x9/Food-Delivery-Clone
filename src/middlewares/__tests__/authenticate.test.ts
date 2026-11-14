import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  AccessTokenExpiredError,
  AccountNotActiveError,
  InvalidAccessTokenError,
} from "../../modules/auth/auth.errors.js";
import { ROLE_NAMES, type AuthContext } from "../../modules/auth/auth.types.js";
import { createAuthenticate } from "../authenticate.js";
import { errorHandler } from "../error-handler.js";

// The Fake User that make the call so we use him to get it's data from database
const caller: AuthContext = {
  userId: "6f1c2a9e-4b7d-4c1a-9e2f-3a5b7c9d1e2f",
  role: ROLE_NAMES.customer,
};

const setup = () => {
  // Prepare authenticate middleware
  // authenticate return the user (caller) 
  const authenticate = vi.fn(
    async (_accessToken: string): Promise<AuthContext> => caller,
  );
  // A fake route handler, stand-in for the real controller that will sit behind authenticate to a protected route
  const handler = vi.fn((req: express.Request, res: express.Response) => {
    res.json({ auth: req.auth });
  });
  const app = express();
  // Simulation of a protected route (handler)
  app.get("/private", createAuthenticate({ authenticate }), handler);
  // Any Error go to here
  app.use(errorHandler);
  return { app, authenticate, handler };
};

describe("authenticate middleware", () => {
  // Happy Path: Everything Work Correct 
  it("passes the bearer token to the service and puts the caller on req.auth", async () => {
    const { app, authenticate } = setup(); // Arange

    const response = await request(app)
      .get("/private")
      .set("Authorization", "Bearer header.payload.signature"); // Act

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ auth: caller });
    expect(authenticate).toHaveBeenCalledWith("header.payload.signature"); // Assert
  });

  it.each(["bearer", "BEARER"])(
    "accepts the scheme written as %s",
    async (scheme) => {
      const { app } = setup();

      const response = await request(app)
        .get("/private")
        .set("Authorization", `${scheme} some-token`);

      expect(response.status).toBe(200);
    },
  );

  it("answers 401 INVALID_ACCESS_TOKEN when there is no Authorization header", async () => {
    const { app, authenticate, handler } = setup();

    const response = await request(app).get("/private");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: "Access token is required",
      error: { code: "INVALID_ACCESS_TOKEN" },
    });
    expect(authenticate).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it.each([
    "",
    "Bearer",
    "Bearer ",
    "Basic dXNlcjpwYXNz",
    "Token some-token",
    "Bearer a b",
    "Bearer  some-token",
    "some-token",
  ])(
    "answers 401 INVALID_ACCESS_TOKEN for the header %j, without calling the service",
    async (header) => {
      const { app, authenticate, handler } = setup();

      const response = await request(app)
        .get("/private")
        .set("Authorization", header);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        message: "Access token is required",
        error: { code: "INVALID_ACCESS_TOKEN" },
      });
      expect(authenticate).not.toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();
    },
  );

  it.each([
    [
      "an invalid token",
      new InvalidAccessTokenError(),
      401,
      "INVALID_ACCESS_TOKEN",
    ],
    [
      "an expired token",
      new AccessTokenExpiredError(),
      401,
      "ACCESS_TOKEN_EXPIRED",
    ],
    [
      "a suspended account",
      new AccountNotActiveError("suspended"),
      403,
      "ACCOUNT_SUSPENDED",
    ],
  ])(
    "answers in the error envelope for %s and never reaches the handler",
    async (_case, error, status, code) => {
      const { app, authenticate, handler } = setup();
      authenticate.mockRejectedValue(error);

      const response = await request(app)
        .get("/private")
        .set("Authorization", "Bearer some-token");

      expect(response.status).toBe(status);
      expect(response.body).toMatchObject({
        success: false,
        message: error.message,
        error: { code },
      });
      expect(handler).not.toHaveBeenCalled();
    },
  );

  it("answers 500 when the service fails unexpectedly", async () => {
    const { app, authenticate, handler } = setup();
    authenticate.mockRejectedValue(new Error("connection lost"));

    const response = await request(app)
      .get("/private")
      .set("Authorization", "Bearer some-token");

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      error: { code: "INTERNAL_SERVER_ERROR" },
    });
    expect(handler).not.toHaveBeenCalled();
  });
});
