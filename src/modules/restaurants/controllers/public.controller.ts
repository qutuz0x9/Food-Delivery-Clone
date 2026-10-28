import type { Request, Response } from "express";
import type { RestaurantsService } from "../restaurants.service.js";

// HTTP in and out for the public restaurant routes. No rules here: those live in RestaurantsService.
export class PublicRestaurantsController {
  private readonly restaurantsService: RestaurantsService;

  constructor(restaurantsService: RestaurantsService) {
    this.restaurantsService = restaurantsService;
  }

  // GET /cuisines. No input: unknown query parameters are ignored.
  listCuisines = async (_req: Request, res: Response): Promise<void> => {
    const cuisines = await this.restaurantsService.listPublicCuisines();

    res.status(200).json({
      success: true,
      message: "Cuisines retrieved successfully",
      data: { cuisines },
    });
  };
}
