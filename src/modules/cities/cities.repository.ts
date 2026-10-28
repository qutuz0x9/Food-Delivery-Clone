import type { Scalars } from "@prisma/orm-postgres/family-contract/types";
import type { Models } from "../../prisma/contract.d.js";
import type { DbClient } from "../../prisma/db.js";

export type CityRow = Scalars<Models.public_City>;

export class CitiesRepository {
  private readonly db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  async findActive(client: DbClient = this.db): Promise<CityRow[]> {
    // LEARN-TODO (core, guided): CitiesRepository.findActive
    // 1. Start a query on the City model of client (namespace public).
    // 2. Keep only the rows where isActive is true.
    // 3. Sort by name, then by country (plan §2).
    // 4. Return all the matching rows.
    const cities = await client.orm.public.City.where({ isActive: true })
      .orderBy((city) => city.name.asc())
      .orderBy((city) => city.country.asc())
      .all();

    return cities;
  }
}
