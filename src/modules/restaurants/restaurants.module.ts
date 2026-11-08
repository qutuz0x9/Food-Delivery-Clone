import { db } from "../../prisma/db.js";
import { PublicRestaurantsController } from "./controllers/public.controller.js";
import { RestaurantsRepository } from "./restaurants.repository.js";
import { RestaurantsService } from "./restaurants.service.js";
import { buildCuisinesRouter } from "./routes/public.routes.js";

export const restaurantsService = new RestaurantsService(new RestaurantsRepository(db));

export const cuisinesRouter = buildCuisinesRouter(new PublicRestaurantsController(restaurantsService));
