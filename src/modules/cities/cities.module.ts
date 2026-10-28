import { db } from "../../prisma/db.js";
import { CitiesController } from "./cities.controller.js";
import { CitiesRepository } from "./cities.repository.js";
import { buildCitiesRouter } from "./cities.routes.js";
import { CitiesService } from "./cities.service.js";

// Wiring: the one place that creates the module's real instances.
export const citiesService = new CitiesService(new CitiesRepository(db));

// Mounted at /api/v1/cities by src/routes.ts. The admin routes (/admin/cities) join this module later.
export const citiesRouter = buildCitiesRouter(new CitiesController(citiesService));
