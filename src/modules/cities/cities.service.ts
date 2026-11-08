import { toCityResponse } from "./cities.mapper.js";
import type { CitiesRepository } from "./cities.repository.js";
import type { CityResponse } from "./cities.types.js";

export class CitiesService {
  private readonly citiesRepository: CitiesRepository;

  constructor(citiesRepository: CitiesRepository) {
    this.citiesRepository = citiesRepository;
  }

  async listActive(): Promise<CityResponse[]> {
    const cities = await this.citiesRepository.findActive();
    return cities.map((city) => toCityResponse(city));
  }
}
