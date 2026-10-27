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
  return router;
};
