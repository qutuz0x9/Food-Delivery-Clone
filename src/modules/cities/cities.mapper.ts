import type { CityRow } from "./cities.repository.js";
import type { CityResponse } from "./cities.types.js";

// Builds the response field by field, so isActive, createdAt or a future column can never reach the client by accident.
export const toCityResponse = (city: CityRow): CityResponse => ({
  id: city.id,
  name: city.name,
  country: city.country,
});
