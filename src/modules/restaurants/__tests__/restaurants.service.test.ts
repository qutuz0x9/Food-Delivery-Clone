import { describe, expect, it, vi } from "vitest";
import type { RestaurantsRepository } from "../restaurants.repository.js";
import { RestaurantsService } from "../restaurants.service.js";

// A fake repository: the service is tested without a database.
const setup = (found: string[]) => {
  const findPublicCuisineNames = vi.fn(async (): Promise<string[]> => found);
  const service = new RestaurantsService({ findPublicCuisineNames } as unknown as RestaurantsRepository);
  return { service, findPublicCuisineNames };
};

describe("RestaurantsService", () => {
  describe("listPublicCuisines", () => {
    it("returns the names in the repository's order", async () => {
      const { service, findPublicCuisineNames } = setup(["Burgers", "Desserts", "Grills"]);

      await expect(service.listPublicCuisines()).resolves.toStrictEqual(["Burgers", "Desserts", "Grills"]);
      expect(findPublicCuisineNames).toHaveBeenCalledOnce();
    });

    it("returns an empty list when no visible restaurant has a tag", async () => {
      const { service } = setup([]);

      await expect(service.listPublicCuisines()).resolves.toStrictEqual([]);
    });
  });
});
