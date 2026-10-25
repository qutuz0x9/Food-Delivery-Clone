import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keyLength: number) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

// Hashes passwords with scrypt from node:crypto, stored as `scrypt$<salt hex>$<hash hex>`. That is the format
// src/scripts/seed.ts writes, so seeded demo users and registered users share one format. The async scrypt runs on
// libuv's thread pool, so hashing does not block other requests.
export class PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const key = await scryptAsync(password, salt, KEY_LENGTH);
    return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
  }
}
