import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ROLE_NAMES } from "../auth.types.js";
import { accessTokenClaimsSchema, loginCustomerSchema, registerCustomerSchema } from "../auth.validation.js";

const valid = {
  email: "John@Example.com",
  password: "StrongPassword123!",
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "+201234567890",
};

const failedFields = (body: unknown): string[] => {
  const result = registerCustomerSchema.safeParse(body);
  return result.success ? [] : [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
};

const emailOfLength = (length: number): string => {
  const local = "a".repeat(64);
  const labels = ["b".repeat(60), "c".repeat(60), "d".repeat(60)].join(".");
  const tld = "e".repeat(length - local.length - 1 - labels.length - 1);
  return `${local}@${labels}.${tld}`;
};

describe("registerCustomerSchema", () => {
  it("accepts a valid body", () => {
    expect(registerCustomerSchema.safeParse(valid).success).toBe(true);
  });

  it("trims email, names and phone number, and keeps the email's case", () => {
    const result = registerCustomerSchema.parse({
      ...valid,
      email: "  John@Example.com ",
      firstName: " John ",
      lastName: " Doe ",
      phoneNumber: " +201234567890 ",
    });
    expect(result).toEqual(valid);
  });

  it("does not trim the password", () => {
    expect(registerCustomerSchema.parse({ ...valid, password: " secret12 " }).password).toBe(" secret12 ");
  });

  it("rejects a body with every field missing", () => {
    expect(failedFields({}).sort()).toEqual(["email", "firstName", "lastName", "password", "phoneNumber"]);
  });

  it("rejects an invalid email", () => {
    expect(failedFields({ ...valid, email: "not-an-email" })).toEqual(["email"]);
  });

  it("accepts a 254-character email and rejects a 255-character one", () => {
    expect(failedFields({ ...valid, email: emailOfLength(254) })).toEqual([]);
    expect(failedFields({ ...valid, email: emailOfLength(255) })).toEqual(["email"]);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(failedFields({ ...valid, password: "Short1!" })).toEqual(["password"]);
    expect(failedFields({ ...valid, password: "Exactly8" })).toEqual([]);
  });

  it("rejects a password longer than 128 characters", () => {
    expect(failedFields({ ...valid, password: "a".repeat(128) })).toEqual([]);
    expect(failedFields({ ...valid, password: "a".repeat(129) })).toEqual(["password"]);
  });

  it("rejects a first or last name that is blank after trimming", () => {
    expect(failedFields({ ...valid, firstName: "   " })).toEqual(["firstName"]);
    expect(failedFields({ ...valid, lastName: "" })).toEqual(["lastName"]);
  });

  it("rejects a first or last name longer than 100 characters", () => {
    expect(failedFields({ ...valid, firstName: "a".repeat(100) })).toEqual([]);
    expect(failedFields({ ...valid, firstName: "a".repeat(101) })).toEqual(["firstName"]);
    expect(failedFields({ ...valid, lastName: "a".repeat(101) })).toEqual(["lastName"]);
  });

  it("rejects a phone number that is not E.164", () => {
    expect(failedFields({ ...valid, phoneNumber: "01234567890" })).toEqual(["phoneNumber"]);
    expect(failedFields({ ...valid, phoneNumber: "+01234567890" })).toEqual(["phoneNumber"]);
    expect(failedFields({ ...valid, phoneNumber: "+20 123 456 7890" })).toEqual(["phoneNumber"]);
    expect(failedFields({ ...valid, phoneNumber: "+1234567" })).toEqual(["phoneNumber"]);
    expect(failedFields({ ...valid, phoneNumber: "+1234567890123456" })).toEqual(["phoneNumber"]);
  });

  it("accepts phone numbers of 8 and 15 digits", () => {
    expect(failedFields({ ...valid, phoneNumber: "+12345678" })).toEqual([]);
    expect(failedFields({ ...valid, phoneNumber: "+123456789012345" })).toEqual([]);
  });
});

describe("loginCustomerSchema", () => {
  const validLogin = { email: "John@Example.com", password: "StrongPassword123!" };

  const failedLoginFields = (body: unknown): string[] => {
    const result = loginCustomerSchema.safeParse(body);
    return result.success ? [] : [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
  };

  it("accepts a valid body", () => {
    expect(loginCustomerSchema.safeParse(validLogin).success).toBe(true);
  });

  it("trims the email, keeps its case, and does not trim the password", () => {
    const result = loginCustomerSchema.parse({ email: "  John@Example.com ", password: " secret " });
    expect(result).toEqual({ email: "John@Example.com", password: " secret " });
  });

  it("rejects a body with both fields missing", () => {
    expect(failedLoginFields({}).sort()).toEqual(["email", "password"]);
  });

  it("rejects an invalid email", () => {
    expect(failedLoginFields({ ...validLogin, email: "not-an-email" })).toEqual(["email"]);
  });

  it("accepts a 254-character email and rejects a 255-character one", () => {
    expect(failedLoginFields({ ...validLogin, email: emailOfLength(254) })).toEqual([]);
    expect(failedLoginFields({ ...validLogin, email: emailOfLength(255) })).toEqual(["email"]);
  });

  it("rejects an empty password", () => {
    expect(failedLoginFields({ ...validLogin, password: "" })).toEqual(["password"]);
  });

  it("rejects a password longer than 128 characters", () => {
    expect(failedLoginFields({ ...validLogin, password: "a".repeat(128) })).toEqual([]);
    expect(failedLoginFields({ ...validLogin, password: "a".repeat(129) })).toEqual(["password"]);
  });

  it("has no strength rules: a short or simple password still reaches the password check", () => {
    expect(failedLoginFields({ ...validLogin, password: "password" })).toEqual([]);
    expect(failedLoginFields({ ...validLogin, password: "a" })).toEqual([]);
  });
});

describe("accessTokenClaimsSchema", () => {
  const sub = randomUUID();

  it("accepts a payload with a uuid sub and a known role, and keeps only those two claims", () => {
    const result = accessTokenClaimsSchema.safeParse({ sub, role: ROLE_NAMES.customer, iat: 1, exp: 2 });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ sub, role: ROLE_NAMES.customer });
  });

  it.each(Object.values(ROLE_NAMES))("accepts the role %s", (role) => {
    expect(accessTokenClaimsSchema.safeParse({ sub, role }).success).toBe(true);
  });

  it.each([
    ["no sub", { role: ROLE_NAMES.customer }],
    ["a sub that is not a uuid", { sub: "user-1", role: ROLE_NAMES.customer }],
    ["a number as sub", { sub: 42, role: ROLE_NAMES.customer }],
    ["no role", { sub }],
    ["an unknown role", { sub, role: "SuperAdmin" }],
    ["a role in the wrong case", { sub, role: "customer" }],
    ["a number as role", { sub, role: 1 }],
  ])("rejects a payload with %s", (_case, payload) => {
    expect(accessTokenClaimsSchema.safeParse(payload).success).toBe(false);
  });

  it.each([["a string", "just-a-string"], ["null", null]])("rejects %s instead of an object", (_case, payload) => {
    expect(accessTokenClaimsSchema.safeParse(payload).success).toBe(false);
  });
});
