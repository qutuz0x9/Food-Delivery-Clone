import { db, type Tx } from "../prisma/db.js";

const ROLLBACK = Symbol("rollback");

// Runs a database test inside a transaction and always rolls it back, so a test never leaves rows behind and tests
// can't see each other's data. Pass `tx` to every repository call in the test.
// Postgres aborts a transaction after an error, so a test can't run more queries after an expected failure (e.g. a
// duplicate insert): make the failing query the last one.
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
