import { Router } from "express";
import type { PublicPaymentsController } from "../controllers/public.controller.js";

export const buildPaymentMethodsRouter = (controller: PublicPaymentsController): Router => {
  const router = Router();
  router.get("/", controller.listMethods);
  return router;
};
