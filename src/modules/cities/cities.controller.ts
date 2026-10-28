import type { Request, Response } from "express";
import type { CitiesService } from "./cities.service.js";

// HTTP in and out for the public city routes. No rules here: those live in CitiesService.
export class CitiesController {
  private readonly citiesService: CitiesService;

  constructor(citiesService: CitiesService) {
    this.citiesService = citiesService;
  }

  // GET /cities. No input: unknown query parameters are ignored.
  list = async (_req: Request, res: Response): Promise<void> => {
    const cities = await this.citiesService.listActive();

    res.status(200).json({
      success: true,
      message: "Cities retrieved successfully",
      data: { cities },
    });
  };
}
