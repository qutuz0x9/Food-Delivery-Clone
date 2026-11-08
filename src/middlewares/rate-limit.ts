import { rateLimit, type RateLimitRequestHandler } from "express-rate-limit";
import { TooManyRequestsError } from "../common/errors/http-errors.js";

export interface RateLimitConfig {
  readonly windowMs: number;
  readonly limit: number;
}

export const createRateLimiter = (config: RateLimitConfig): RateLimitRequestHandler =>
  rateLimit({
    windowMs: config.windowMs,
    limit: config.limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new TooManyRequestsError());
    },
  });
