import { db, type Tx } from "../prisma/db.js";

const ROLLBACK = Symbol("rollback");

// Postgres aborts a transaction after an error: make an expected failure the test's last query.
export const withRollback = async (work: (tx: Tx) => Promise<void>): Promise<void> => {
  try {
    await db.transaction(async (tx) => {
      await work(tx);
      throw ROLLBACK;
    });
  } catch (error) {
    if (error !== ROLLBACK) throw error;
  }
};
