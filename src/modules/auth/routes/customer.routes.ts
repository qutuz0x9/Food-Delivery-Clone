import { Router, type RequestHandler } from "express";
import { validate } from "../../../middlewares/validate.js";
import { loginCustomerSchema, registerCustomerSchema } from "../auth.validation.js";
import type { CustomerAuthController } from "../controllers/customer.controller.js";

// Mounted at /api/v1/auth. Routing and validation only; docs/api/paths/customer.yaml documents each route.
// The login limiter runs before validation, so badly formed attempts count toward the limit too.
export const buildCustomerAuthRouter = (controller: CustomerAuthController, loginLimiter: RequestHandler): Router => {
  const router = Router();
  router.post("/register/customer", validate({ body: registerCustomerSchema }), controller.register);
  router.post("/login/customer", loginLimiter, validate({ body: loginCustomerSchema }), controller.login);
  // No limiter: the token is 32 random bytes, so there is nothing to guess.
  router.post("/refresh/customer", controller.refresh);
  // No access token: holding the refresh cookie is enough to end it, even after the access token has expired.
  router.post("/logout/customer", controller.logout);
  return router;
};
