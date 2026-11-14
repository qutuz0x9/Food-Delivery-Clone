import type { RequestHandler } from "express";
import { InvalidAccessTokenError } from "../modules/auth/auth.errors.js";
import type { AuthContext } from "../modules/auth/auth.types.js";

// Note by me: this called declaration merging, because the `req` has a type so if we use req.auth it will give
// error so we extend the express Request Interface.
// Teach TypeScript that req.auth exist
// Giving `req` a new property

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}

export interface AccessTokenAuthenticator {
  authenticate(accessToken: string): Promise<AuthContext>;
}

const BEARER_SCHEME = "bearer";

const readBearerToken = (header: string | undefined): string | null => {
  const parts = header?.split(" ") ?? [];
  if (parts.length !== 2) return null;
  const [scheme, token] = parts;
  if (scheme?.toLowerCase() !== BEARER_SCHEME || !token) return null;
  return token;
};

// It return an Authenticate Middleware
// In ExpressJs Docs it called "Configurable Middleware"
export const createAuthenticate =
  (authenticator: AccessTokenAuthenticator): RequestHandler =>
  async (req, _res, next) => {
    const token = readBearerToken(req.headers.authorization);
    if (!token) throw new InvalidAccessTokenError("missing");
    req.auth = await authenticator.authenticate(token); // Important line, it's like authService.authenticate
    next();
  };
