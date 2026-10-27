import { randomBytes, scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { PasswordHasher } from "../password-hasher.js";

const hasher = new PasswordHasher();

describe("PasswordHasher", () => {
  it("stores a salted hash, never the password, and a new salt each time", async () => {
    const first = await hasher.hash("StrongPassword123!");
    const second = await hasher.hash("StrongPassword123!");

    expect(first).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(first).not.toContain("StrongPassword123!");
    expect(first).not.toBe(second);
  });

  describe("verify", () => {
    it("returns true for the password that was hashed", async () => {
      const stored = await hasher.hash("StrongPassword123!");

      expect(await hasher.verify("StrongPassword123!", stored)).toBe(true);
    });

    it("returns false for any other password, including a different case or extra spaces", async () => {
      const stored = await hasher.hash("StrongPassword123!");

      expect(await hasher.verify("strongpassword123!", stored)).toBe(false);
      expect(await hasher.verify(" StrongPassword123!", stored)).toBe(false);
    });

    it("returns false when there is no stored hash (no such user)", async () => {
      expect(await hasher.verify("StrongPassword123!", null)).toBe(false);
    });

    it("accepts the hashes src/scripts/seed.ts writes", async () => {
      const salt = randomBytes(16);
      const seeded = `scrypt$${salt.toString("hex")}$${scryptSync("DemoPassword1", salt, 64).toString("hex")}`;

      expect(await hasher.verify("DemoPassword1", seeded)).toBe(true);
    });

    it("throws for a stored hash in an unknown format, instead of answering false", async () => {
      await expect(hasher.verify("StrongPassword123!", "plain-text-password")).rejects.toThrow(/scrypt/);
    });
  });
});
