import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AppError } from "../../common/errors/app-error.js";
import { ConflictError, ValidationError } from "../../common/errors/http-errors.js";
import { logger } from "../../config/logger.js";
import { EmailAlreadyExistsError } from "../../modules/auth/auth.errors.js";
import { errorHandler } from "../error-handler.js";

// An app whose only route throws `error`, with the real errorHandler behind it.
const appThrowing = (error: unknown) => {
  const app = express();
  app.get("/", () => {
    throw error;
  });
  app.use(errorHandler);
  return app;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AppError", () => {
  it("sets the subclass name, status, code and fields", () => {
    const error = new EmailAlreadyExistsError();

    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe("EmailAlreadyExistsError");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("EMAIL_ALREADY_EXISTS");
    expect(error.fields).toBeUndefined();
    expect(new ValidationError({ email: "Invalid email address" }).fields).toEqual({ email: "Invalid email address" });
  });
});

describe("errorHandler", () => {
  it("responds to an AppError with its status and the envelope, without a fields key", async () => {
    const res = await request(appThrowing(new ConflictError("Email address is already registered", "EMAIL_ALREADY_EXISTS")))
      .get("/");

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      message: "Email address is already registered",
      error: { code: "EMAIL_ALREADY_EXISTS" },
    });
  });

  it("includes the fields of an AppError that has them", async () => {
    const res = await request(appThrowing(new ValidationError({ email: "Invalid email address" }))).get("/");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "Validation failed",
      error: { code: "VALIDATION_ERROR", fields: { email: "Invalid email address" } },
    });
  });

  it("turns a ZodError into a 400 with one entry per field path", async () => {
    const schema = z.object({ email: z.string(), profile: z.object({ name: z.string() }) });
    const zodError = schema.safeParse({ profile: {} }).error;

    const res = await request(appThrowing(zodError)).get("/");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "Validation failed",
      error: {
        code: "VALIDATION_ERROR",
        fields: { email: expect.any(String), "profile.name": expect.any(String) },
      },
    });
  });

  it("keeps the first message when a field fails several rules", async () => {
    const schema = z.object({ password: z.string().min(8, "Too short").regex(/\d/, "Needs a digit") });
    const zodError = schema.safeParse({ password: "abc" }).error;

    const res = await request(appThrowing(zodError)).get("/");

    expect(res.body.error.fields).toEqual({ password: "Too short" });
  });

  it("logs an unknown error and responds 500 without leaking its message", async () => {
    // No request logger in this small app, so errorHandler falls back to the app logger.
    const log = vi.spyOn(logger, "error");
    const secret = new Error("connection to db-internal:5432 refused");

    const res = await request(appThrowing(secret)).get("/");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      message: "An unexpected error occurred",
      error: { code: "INTERNAL_SERVER_ERROR" },
    });
    expect(res.text).not.toContain("db-internal");
    expect(log).toHaveBeenCalledWith({ err: secret }, "unhandled error");
  });
});
