import type { RestaurantsRepository } from "./restaurants.repository.js";

export class RestaurantsService {
  private readonly restaurantsRepository: RestaurantsRepository;

  constructor(restaurantsRepository: RestaurantsRepository) {
    this.restaurantsRepository = restaurantsRepository;
  }

  async listPublicCuisines(): Promise<string[]> {
    return this.restaurantsRepository.findPublicCuisineNames();
  }
}
