import { Router } from "express";
import type { CustomerProfileController } from "../controllers/customer.controller.js";

export const buildCustomerRouter = (controller: CustomerProfileController): Router => {
  const router = Router();
  router.get("/me", controller.getMe);
  return router;
};
