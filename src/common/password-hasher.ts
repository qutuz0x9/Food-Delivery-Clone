import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keyLength: number) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

interface StoredHash {
  readonly salt: Buffer;
  readonly key: Buffer;
}

// Hashed when there is no user, so a missing email takes as long as a wrong password.
const DUMMY_HASH: StoredHash = { salt: Buffer.alloc(SALT_BYTES), key: Buffer.alloc(KEY_LENGTH) };

const parseStoredHash = (stored: string): StoredHash => {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) {
    // A malformed stored hash is a data bug: let it become a 500, not a wrong password.
    throw new Error("Stored password hash is not in the scrypt$<salt>$<hash> format");
  }
  return { salt: Buffer.from(saltHex, "hex"), key: Buffer.from(keyHex, "hex") };
};

// Same format as src/scripts/seed.ts: scrypt$<salt hex>$<hash hex>.
export class PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const key = await scryptAsync(password, salt, KEY_LENGTH);
    return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
  }

  async verify(password: string, storedHash: string | null): Promise<boolean> {
    const { salt, key } = storedHash === null ? DUMMY_HASH : parseStoredHash(storedHash);
    const candidate = await scryptAsync(password, salt, key.length);
    return storedHash !== null && timingSafeEqual(candidate, key);
  }
}
