import type { RestaurantsRepository } from "./restaurants.repository.js";

// Rules for the restaurants tables. Other modules reach it through ./index.js.
export class RestaurantsService {
  private readonly restaurantsRepository: RestaurantsRepository;

  constructor(restaurantsRepository: RestaurantsRepository) {
    this.restaurantsRepository = restaurantsRepository;
  }

  // GET /cuisines: the cuisine names customers can filter GET /restaurants by, in the repository's order.
  async listPublicCuisines(): Promise<string[]> {
    return this.restaurantsRepository.findPublicCuisineNames();
  }
}
