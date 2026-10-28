import { toCityResponse } from "./cities.mapper.js";
import type { CitiesRepository } from "./cities.repository.js";
import type { CityResponse } from "./cities.types.js";

// Rules for the cities table. Other modules reach it through ./index.js.
export class CitiesService {
  private readonly citiesRepository: CitiesRepository;

  constructor(citiesRepository: CitiesRepository) {
    this.citiesRepository = citiesRepository;
  }

  // GET /cities: the active cities, in the order the repository sorted them.
  async listActive(): Promise<CityResponse[]> {
    // LEARN-TODO (core, guided): CitiesService.listActive
    // 1. Get the active cities from this.citiesRepository.
    const cities = await this.citiesRepository.findActive();
    // 2. Map each row with toCityResponse.
    // 3. Return the mapped list.
    return cities.map((city) => toCityResponse(city));
  }
}
