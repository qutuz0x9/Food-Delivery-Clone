import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import type { IssuedRefreshToken, RoleName } from "./auth.types.js";
import {
  AccessTokenExpiredError,
  InvalidAccessTokenError,
} from "./auth.errors.js";
import { accessTokenClaimsSchema } from "./auth.validation.js";

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
const JWT_ALGORITHM = "HS256";

export class TokenService {
  private readonly config: TokenConfig;

  constructor(config: TokenConfig) {
    this.config = config;
  }

  signAccessToken(claims: AccessTokenClaims): string {
    // Pinned, so a verifier can't be tricked into accepting another algorithm.
    return jwt.sign({ role: claims.role }, this.config.accessSecret, {
      algorithm: JWT_ALGORITHM,
      subject: claims.userId,
      expiresIn: this.config.accessTtlSeconds,
    });
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    let payload: unknown;
    try {
      payload = jwt.verify(token, this.config.accessSecret, {
        algorithms: [JWT_ALGORITHM],
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError)
        throw new AccessTokenExpiredError();
      else if (error instanceof jwt.JsonWebTokenError)
        throw new InvalidAccessTokenError();
      throw error;
    }
    const result = accessTokenClaimsSchema.safeParse(payload);
    if (!result.success) throw new InvalidAccessTokenError();
    const tokenClaims: AccessTokenClaims = {
      role: result.data.role,
      userId: result.data.sub,
    };

    return tokenClaims;
  }

  // Made here, not by the database, so a rotation can link the old row before inserting the new one.
  createRefreshToken(now: Date = new Date()): IssuedRefreshToken {
    const token = randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
    return {
      id: randomUUID(),
      token,
      tokenHash: hashRefreshToken(token),
      expiresAt: new Date(now.getTime() + this.config.refreshTtlDays * DAY_MS),
    };
  }

  hashRefreshToken(token: string): string {
    return hashRefreshToken(token);
  }
}

// SHA-256, not a slow hash: the token is 32 random bytes, and the lookup needs the same hash every time.
const hashRefreshToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");
