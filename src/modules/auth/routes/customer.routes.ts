import { Router } from "express";
import { validate } from "../../../middlewares/validate.js";
import { registerCustomerSchema } from "../auth.validation.js";
import type { CustomerAuthController } from "../controllers/customer.controller.js";

// Mounted at /api/v1/auth. Routing and validation only; docs/api/paths/customer.yaml documents each route.
export const buildCustomerAuthRouter = (controller: CustomerAuthController): Router => {
  const router = Router();
  router.post("/register/customer", validate({ body: registerCustomerSchema }), controller.register);
  return router;
};

