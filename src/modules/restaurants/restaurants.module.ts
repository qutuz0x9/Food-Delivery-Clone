import { db } from "../../prisma/db.js";
import { PublicRestaurantsController } from "./controllers/public.controller.js";
import { RestaurantsRepository } from "./restaurants.repository.js";
import { RestaurantsService } from "./restaurants.service.js";
import { buildCuisinesRouter } from "./routes/public.routes.js";

// Wiring: the one place that creates the module's real instances.
export const restaurantsService = new RestaurantsService(new RestaurantsRepository(db));

// Mounted at /api/v1/cuisines by src/routes.ts.
export const cuisinesRouter = buildCuisinesRouter(new PublicRestaurantsController(restaurantsService));
