import type { Request, Response } from "express";
import type { RestaurantsService } from "../restaurants.service.js";

export class PublicRestaurantsController {
  private readonly restaurantsService: RestaurantsService;

  constructor(restaurantsService: RestaurantsService) {
    this.restaurantsService = restaurantsService;
  }

  listCuisines = async (_req: Request, res: Response): Promise<void> => {
    const cuisines = await this.restaurantsService.listPublicCuisines();

    res.status(200).json({
      success: true,
      message: "Cuisines retrieved successfully",
      data: { cuisines },
    });
  };
}
