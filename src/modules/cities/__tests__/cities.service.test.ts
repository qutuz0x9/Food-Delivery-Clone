import { describe, expect, it, vi } from "vitest";
import type { CitiesRepository, CityRow } from "../cities.repository.js";
import { CitiesService } from "../cities.service.js";

// Rows as the repository returns them: every column, already filtered and sorted.
const rows: CityRow[] = [
  { id: "city-1", name: "Alexandria", country: "Egypt", isActive: true, createdAt: "2026-10-01T00:00:00.000Z" },
  { id: "city-2", name: "Cairo", country: "Egypt", isActive: true, createdAt: "2026-10-01T00:00:00.000Z" },
] as CityRow[];

// A fake repository: the service is tested without a database.
const setup = (found: CityRow[]) => {
  const findActive = vi.fn(async (): Promise<CityRow[]> => found);
  const service = new CitiesService({ findActive } as unknown as CitiesRepository);
  return { service, findActive };
};

describe("CitiesService", () => {
  describe("listActive", () => {
    it("returns id, name and country only, in the repository's order", async () => {
      const { service, findActive } = setup(rows);

      const cities = await service.listActive();

      expect(findActive).toHaveBeenCalledOnce();
      // toStrictEqual fails on any extra key, so isActive and createdAt must be gone.
      expect(cities).toStrictEqual([
        { id: "city-1", name: "Alexandria", country: "Egypt" },
        { id: "city-2", name: "Cairo", country: "Egypt" },
      ]);
    });

    it("returns an empty list when no city is active", async () => {
      const { service } = setup([]);

      await expect(service.listActive()).resolves.toStrictEqual([]);
    });
  });
});
