import { rateLimit, type RateLimitRequestHandler } from "express-rate-limit";
import { TooManyRequestsError } from "../common/errors/http-errors.js";

export interface RateLimitConfig {
  readonly windowMs: number;
  // Requests one IP may make in each window; the next one gets a 429.
  readonly limit: number;
}

// Counts requests per client IP and, over the limit, hands a TooManyRequestsError to errorHandler, so a 429 has the
// same envelope as every other error. Used on login, the one route anyone can call to guess passwords. The counts
// live in this process's memory: enough for one API container, but several containers would each count on their own.
export const createRateLimiter = (config: RateLimitConfig): RateLimitRequestHandler =>
  rateLimit({
    windowMs: config.windowMs,
    limit: config.limit,
    // The standard RateLimit headers (and Retry-After on a 429) instead of the old X-RateLimit-* ones.
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new TooManyRequestsError());
    },
  });
