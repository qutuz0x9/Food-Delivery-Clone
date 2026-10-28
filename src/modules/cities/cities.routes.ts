import { Router } from "express";
import type { CitiesController } from "./cities.controller.js";

// Mounted at /api/v1/cities. Routing only; docs/api/paths/city.yaml documents the route. No validate(): the route
// takes no input.
export const buildCitiesRouter = (controller: CitiesController): Router => {
  const router = Router();
  router.get("/", controller.list);
  return router;
};
