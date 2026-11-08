import { Router } from "express";
import type { PublicRestaurantsController } from "../controllers/public.controller.js";

export const buildCuisinesRouter = (controller: PublicRestaurantsController): Router => {
  const router = Router();
  router.get("/", controller.listCuisines);
  return router;
};
