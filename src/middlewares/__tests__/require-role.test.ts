import express, { type RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { ROLE_NAMES, type AuthContext } from "../../modules/auth/auth.types.js";
import { errorHandler } from "../error-handler.js";
import { requireRole } from "../require-role.js";

const userId = "6f1c2a9e-4b7d-4c1a-9e2f-3a5b7c9d1e2f";

const setup = (caller: AuthContext | undefined, guard: RequestHandler) => {
  const handler = vi.fn((_req: express.Request, res: express.Response) => {
    res.json({ ok: true });
  });
  const app = express();
  app.get(
    "/private",
    (req, _res, next) => {
      if (caller) req.auth = caller;
      next();
    },
    guard,
    handler,
  );
  app.use(errorHandler);
  return { app, handler };
};

describe("requireRole", () => {
  it("lets the allowed role through", async () => {
    const { app, handler } = setup({ userId, role: ROLE_NAMES.customer }, requireRole(ROLE_NAMES.customer));

    const response = await request(app).get("/private");

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("lets any one of several allowed roles through", async () => {
    const { app } = setup({ userId, role: ROLE_NAMES.restaurant }, requireRole(ROLE_NAMES.admin, ROLE_NAMES.restaurant));

    const response = await request(app).get("/private");

    expect(response.status).toBe(200);
  });

  it("answers 403 FORBIDDEN for another actor's role, such as a driver on a customer route", async () => {
    const { app, handler } = setup({ userId, role: ROLE_NAMES.driver }, requireRole(ROLE_NAMES.customer));

    const response = await request(app).get("/private");

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      message: "You do not have permission to perform this action",
      error: { code: "FORBIDDEN" },
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("fails closed with a 500 when authenticate did not run before it", async () => {
    const { app, handler } = setup(undefined, requireRole(ROLE_NAMES.customer));

    const response = await request(app).get("/private");

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({ error: { code: "INTERNAL_SERVER_ERROR" } });
    expect(handler).not.toHaveBeenCalled();
  });

  it("accepts only known role names, and at least one", () => {
    // @ts-expect-error
    expect(() => requireRole("Custmer")).not.toThrow();
    // @ts-expect-error
    expect(() => requireRole()).not.toThrow();
  });
});
