import { Router } from "express";
import type { PublicPaymentsController } from "../controllers/public.controller.js";

// Mounted at /api/v1/payment-methods. Routing only; docs/api/paths/payment.yaml documents the route. Public, and no
// validate(): the route takes no input.
export const buildPaymentMethodsRouter = (controller: PublicPaymentsController): Router => {
  const router = Router();
  router.get("/", controller.listMethods);
  return router;
};
