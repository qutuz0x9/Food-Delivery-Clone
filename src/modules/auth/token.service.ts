import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import type { IssuedRefreshToken, RoleName } from "./auth.types.js";

export interface TokenConfig {
  readonly accessSecret: string;
  readonly accessTtlSeconds: number;
  readonly refreshTtlDays: number;
}

export interface AccessTokenClaims {
  readonly userId: string;
  readonly role: RoleName;
}

const REFRESH_TOKEN_BYTES = 32;
const DAY_MS = 24 * 60 * 60 * 1000;

// Creates the two tokens a login hands out. Access tokens are short-lived JWTs checked without the database;
// refresh tokens are random strings checked against the hash stored in refresh_tokens.
export class TokenService {
  private readonly config: TokenConfig;

  constructor(config: TokenConfig) {
    this.config = config;
  }

  signAccessToken(claims: AccessTokenClaims): string {
    // `algorithm` is pinned so a verifier configured the same way can't be tricked into accepting another one.
    return jwt.sign({ role: claims.role }, this.config.accessSecret, {
      algorithm: "HS256",
      subject: claims.userId,
      expiresIn: this.config.accessTtlSeconds,
    });
  }

  // The id is made here, not by the database, so a rotation can point the old row at the new one
  // (replaced_by_token) before the new row is inserted.
  createRefreshToken(now: Date = new Date()): IssuedRefreshToken {
    const token = randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
    return {
      id: randomUUID(),
      token,
      tokenHash: hashRefreshToken(token),
      expiresAt: new Date(now.getTime() + this.config.refreshTtlDays * DAY_MS),
    };
  }

  // Refresh hashes the token from the cookie the same way, then looks the row up by token_hash.
  hashRefreshToken(token: string): string {
    return hashRefreshToken(token);
  }
}

// A fast hash is enough here: the token is 32 random bytes, so there is nothing to brute-force, and the same input
// always gives the same hash, which is what lets refresh look the row up by token_hash.
const hashRefreshToken = (token: string): string => createHash("sha256").update(token).digest("hex");
