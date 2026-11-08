import { db } from "../../prisma/db.js";
import { CitiesController } from "./cities.controller.js";
import { CitiesRepository } from "./cities.repository.js";
import { buildCitiesRouter } from "./cities.routes.js";
import { CitiesService } from "./cities.service.js";

export const citiesService = new CitiesService(new CitiesRepository(db));

export const citiesRouter = buildCitiesRouter(new CitiesController(citiesService));
