import { Router } from "express";
import { PasswordHasher } from "../../common/password-hasher.js";
import { env } from "../../config/env.js";
import { createAuthenticate } from "../../middlewares/authenticate.js";
import { createRateLimiter } from "../../middlewares/rate-limit.js";
import { db } from "../../prisma/db.js";
import { customersService } from "../customers/index.js";
import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { CustomerAuthController } from "./controllers/customer.controller.js";
import { buildCustomerAuthRouter } from "./routes/customer.routes.js";
import { TokenService, type TokenConfig } from "./token.service.js";

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

// The Middleware Itself and We will use it in #9 Issues for the GET /customer/me
export const authenticate = createAuthenticate(authService);

const customerController = new CustomerAuthController(authService, {
  secure: env.NODE_ENV === "production",
  path: "/api/v1/auth",
});

const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 10 });

export const authRouter = Router();
authRouter.use(buildCustomerAuthRouter(customerController, loginLimiter));
