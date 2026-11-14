import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccessTokenExpiredError, InvalidAccessTokenError } from "../auth.errors.js";
import { ROLE_NAMES } from "../auth.types.js";
import { TokenService } from "../token.service.js";

const SECRET = "test-access-secret-with-at-least-32-characters";
const tokens = new TokenService({ accessSecret: SECRET, accessTtlSeconds: 900, refreshTtlDays: 7 });
const userId = randomUUID();

const sign = (payload: object, options: jwt.SignOptions = {}, secret: string = SECRET): string =>
  jwt.sign(payload, secret, { algorithm: "HS256", expiresIn: 900, ...options });

const base64url = (value: object): string => Buffer.from(JSON.stringify(value)).toString("base64url");

describe("TokenService.verifyAccessToken", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns exactly the userId and role of a token made by signAccessToken", () => {
    const token = tokens.signAccessToken({ userId, role: ROLE_NAMES.customer });

    expect(tokens.verifyAccessToken(token)).toEqual({ userId, role: ROLE_NAMES.customer });
  });

  it.each(Object.values(ROLE_NAMES))("accepts the role %s", (role) => {
    const token = tokens.signAccessToken({ userId, role });

    expect(tokens.verifyAccessToken(token).role).toBe(role);
  });

  it("throws AccessTokenExpiredError for an expired token", () => {
    const expired = sign({ role: ROLE_NAMES.customer }, { subject: userId, expiresIn: -10 });

    expect(() => tokens.verifyAccessToken(expired)).toThrow(AccessTokenExpiredError);
  });

  it("throws InvalidAccessTokenError, not AccessTokenExpiredError, for an expired token signed with another secret", () => {
    const forged = sign({ role: ROLE_NAMES.admin }, { subject: userId, expiresIn: -10 }, "another-secret-with-at-least-32-characters!");

    expect(() => tokens.verifyAccessToken(forged)).toThrow(InvalidAccessTokenError);
  });

  it("throws InvalidAccessTokenError for a token signed with another secret", () => {
    const forged = sign({ role: ROLE_NAMES.admin }, { subject: userId }, "another-secret-with-at-least-32-characters!");

    expect(() => tokens.verifyAccessToken(forged)).toThrow(InvalidAccessTokenError);
  });

  it("throws InvalidAccessTokenError for an unsigned token with alg none", () => {
    const now = Math.floor(Date.now() / 1000);
    const unsigned = `${base64url({ alg: "none", typ: "JWT" })}.${base64url({ sub: userId, role: ROLE_NAMES.admin, iat: now, exp: now + 900 })}.`;

    expect(() => tokens.verifyAccessToken(unsigned)).toThrow(InvalidAccessTokenError);
  });

  it("throws InvalidAccessTokenError for a token signed with our secret but with HS512", () => {
    const otherAlgorithm = sign({ role: ROLE_NAMES.customer }, { subject: userId, algorithm: "HS512" });

    expect(() => tokens.verifyAccessToken(otherAlgorithm)).toThrow(InvalidAccessTokenError);
  });

  it("throws InvalidAccessTokenError when the payload was changed after signing", () => {
    const [header, , signature] = tokens.signAccessToken({ userId, role: ROLE_NAMES.customer }).split(".");
    const now = Math.floor(Date.now() / 1000);
    const tampered = `${header}.${base64url({ role: ROLE_NAMES.admin, sub: userId, iat: now, exp: now + 900 })}.${signature}`;

    expect(() => tokens.verifyAccessToken(tampered)).toThrow(InvalidAccessTokenError);
  });

  it.each(["not-a-jwt", "a.b.c", ""])("throws InvalidAccessTokenError for %j", (token) => {
    expect(() => tokens.verifyAccessToken(token)).toThrow(InvalidAccessTokenError);
  });

  it.each([
    ["no role", { sub: userId }],
    ["an unknown role", { sub: userId, role: "SuperAdmin" }],
    ["a role in the wrong case", { sub: userId, role: "customer" }],
    ["no sub", { role: ROLE_NAMES.customer }],
    ["a sub that is not a uuid", { sub: "user-1", role: ROLE_NAMES.customer }],
  ])("throws InvalidAccessTokenError for a correctly signed token with %s", (_case, payload) => {
    expect(() => tokens.verifyAccessToken(sign(payload))).toThrow(InvalidAccessTokenError);
  });

  it("throws InvalidAccessTokenError for a correctly signed token whose payload is a string", () => {
    const stringPayload = jwt.sign("just-a-string", SECRET, { algorithm: "HS256" });

    expect(() => tokens.verifyAccessToken(stringPayload)).toThrow(InvalidAccessTokenError);
  });

  it("rethrows an error that does not come from jsonwebtoken unchanged, so it becomes a 500", () => {
    const unexpected = new RangeError("crypto failure");
    vi.spyOn(jwt, "verify").mockImplementation(() => {
      throw unexpected;
    });

    expect(() => tokens.verifyAccessToken("any-token")).toThrow(unexpected);
  });
});
