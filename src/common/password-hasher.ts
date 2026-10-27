import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keyLength: number) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

interface StoredHash {
  readonly salt: Buffer;
  readonly key: Buffer;
}

// Hashed instead of a real one when there is no user, so that case costs one scrypt too. Its result is never used.
const DUMMY_HASH: StoredHash = { salt: Buffer.alloc(SALT_BYTES), key: Buffer.alloc(KEY_LENGTH) };

const parseStoredHash = (stored: string): StoredHash => {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) {
    // A bad hash in the database is a data bug, not a wrong password: let it become a 500.
    throw new Error("Stored password hash is not in the scrypt$<salt>$<hash> format");
  }
  return { salt: Buffer.from(saltHex, "hex"), key: Buffer.from(keyHex, "hex") };
};

// Hashes passwords with scrypt from node:crypto, stored as `scrypt$<salt hex>$<hash hex>`. That is the format
// src/scripts/seed.ts writes, so seeded demo users and registered users share one format. The async scrypt runs on
// libuv's thread pool, so hashing does not block other requests.
export class PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const key = await scryptAsync(password, salt, KEY_LENGTH);
    return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
  }

  // A hash can't be reversed, so this hashes `password` again with the salt saved in `storedHash` and compares the
  // two results. timingSafeEqual takes the same time wherever the bytes differ, so the answer's speed leaks nothing.
  // Pass null when there is no user: it still runs scrypt (on a dummy) and returns false, so "no such email" takes
  // as long as "wrong password".
  async verify(password: string, storedHash: string | null): Promise<boolean> {
    const { salt, key } = storedHash === null ? DUMMY_HASH : parseStoredHash(storedHash);
    const candidate = await scryptAsync(password, salt, key.length);
    return storedHash !== null && timingSafeEqual(candidate, key);
  }
}
