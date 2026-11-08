import { Router, type RequestHandler } from "express";
import { validate } from "../../../middlewares/validate.js";
import { loginCustomerSchema, registerCustomerSchema } from "../auth.validation.js";
import type { CustomerAuthController } from "../controllers/customer.controller.js";

// The limiter runs before validation, so malformed attempts count too.
export const buildCustomerAuthRouter = (controller: CustomerAuthController, loginLimiter: RequestHandler): Router => {
  const router = Router();
  router.post("/register/customer", validate({ body: registerCustomerSchema }), controller.register);
  router.post("/login/customer", loginLimiter, validate({ body: loginCustomerSchema }), controller.login);
  router.post("/refresh/customer", controller.refresh);
  router.post("/logout/customer", controller.logout);
  return router;
};
