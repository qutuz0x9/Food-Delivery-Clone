import { Router } from "express";
import type { CitiesController } from "./cities.controller.js";

export const buildCitiesRouter = (controller: CitiesController): Router => {
  const router = Router();
  router.get("/", controller.list);
  return router;
};
