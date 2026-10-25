import { describe, expect, it } from "vitest";
import { registerCustomerSchema } from "../auth.validation.js";

const valid = {
  email: "John@Example.com",
  password: "StrongPassword123!",
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "+201234567890",
};

// The paths of the fields that failed, so each test checks that the right rule fired.
const failedFields = (body: unknown): string[] => {
  const result = registerCustomerSchema.safeParse(body);
  return result.success ? [] : [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
};

// A syntactically valid address of exactly `length` characters: a 64-character local part and 60-character labels.
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
    expect(failedFields({ ...valid, phoneNumber: "01234567890" })).toEqual(["phoneNumber"]); // no "+"
    expect(failedFields({ ...valid, phoneNumber: "+01234567890" })).toEqual(["phoneNumber"]); // starts with 0
    expect(failedFields({ ...valid, phoneNumber: "+20 123 456 7890" })).toEqual(["phoneNumber"]); // spaces
    expect(failedFields({ ...valid, phoneNumber: "+1234567" })).toEqual(["phoneNumber"]); // 7 digits
    expect(failedFields({ ...valid, phoneNumber: "+1234567890123456" })).toEqual(["phoneNumber"]); // 16 digits
  });

  it("accepts phone numbers of 8 and 15 digits", () => {
    expect(failedFields({ ...valid, phoneNumber: "+12345678" })).toEqual([]);
    expect(failedFields({ ...valid, phoneNumber: "+123456789012345" })).toEqual([]);
  });
});
