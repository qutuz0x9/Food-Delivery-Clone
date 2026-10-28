import { Router } from "express";
import type { PublicRestaurantsController } from "../controllers/public.controller.js";

// Mounted at /api/v1/cuisines. Routing only; docs/api/paths/restaurant.yaml (listCuisines) documents the route.
// Public, and no validate(): the route takes no input. The public /restaurants routes join this file later.
export const buildCuisinesRouter = (controller: PublicRestaurantsController): Router => {
  const router = Router();
  router.get("/", controller.listCuisines);
  return router;
};
