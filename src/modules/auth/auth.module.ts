import { Router } from "express";
import { PasswordHasher } from "../../common/password-hasher.js";
import { env } from "../../config/env.js";
import { createRateLimiter } from "../../middlewares/rate-limit.js";
import { db } from "../../prisma/db.js";
import { customersService } from "../customers/index.js";
import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { CustomerAuthController } from "./controllers/customer.controller.js";
import { buildCustomerAuthRouter } from "./routes/customer.routes.js";
import { TokenService, type TokenConfig } from "./token.service.js";

// Wiring: the one place that creates the module's real instances and reads env.
const tokenConfig: TokenConfig = {
  accessSecret: env.JWT_ACCESS_SECRET,
  accessTtlSeconds: env.JWT_ACCESS_TTL_SECONDS,
  refreshTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
};
const tokenService = new TokenService(tokenConfig);

const authService = new AuthService(
  db,
  new AuthRepository(db),
  customersService,
  new PasswordHasher(),
  tokenService,
);

const customerController = new CustomerAuthController(authService, {
  secure: env.NODE_ENV === "production",
  path: "/api/v1/auth",
});

// 10 login attempts per IP every 15 minutes: plenty for a person, far too few for a password-guessing script.
const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 10 });

// Mounted at /api/v1/auth by src/routes.ts. Driver and admin auth routers join this one later.
export const authRouter = Router();
authRouter.use(buildCustomerAuthRouter(customerController, loginLimiter));
