// Public API of the cities module: other modules import only from here, never the repository.
export { citiesService } from "./cities.module.js";
export type { CitiesService } from "./cities.service.js";
export type { CityResponse } from "./cities.types.js";
