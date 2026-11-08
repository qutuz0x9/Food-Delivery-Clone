import type { CityRow } from "./cities.repository.js";
import type { CityResponse } from "./cities.types.js";

export const toCityResponse = (city: CityRow): CityResponse => ({
  id: city.id,
  name: city.name,
  country: city.country,
});
