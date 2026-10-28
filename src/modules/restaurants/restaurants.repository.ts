import { db as rootDb, type DbClient } from "../../prisma/db.js";

export class RestaurantsRepository {
  private readonly db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  // The distinct names of the active cuisine tags (restaurant_categories) of every restaurant a customer can see:
  // approved, its user active and not deleted, and at least one active branch. Sorted A to Z.
  // Raw SQL because the ORM has no DISTINCT and Restaurant declares no relation to its branches.
  async findPublicCuisineNames(client: DbClient = this.db): Promise<string[]> {
    const plan = rootDb.raw.sql`
      SELECT DISTINCT rc.name AS name
      FROM public.restaurant_categories rc
      JOIN public.restaurants r ON r.id = rc.restaurant_id
      JOIN identity.users u ON u.id = r.user_id
      WHERE rc.is_active
        AND r.status = 'approved'
        AND u.account_status = 'active'
        AND u.deleted_at IS NULL
        AND EXISTS (
          SELECT 1 FROM public.restaurant_branches b WHERE b.restaurant_id = r.id AND b.is_active
        )
      ORDER BY rc.name
    `
      .returnsRow({ name: "sql/varchar@1" })
      .build();

    // The db client runs a plan through its runtime; a transaction (tests, withRollback) runs it itself.
    const rows = await ("runtime" in client ? client.runtime().query(plan) : client.query(plan));
    return rows.map((row) => row.name);
  }
}
