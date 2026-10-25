import postgres from '@prisma/orm-postgres/runtime';
import { databaseEnv } from '../config/database-env.js';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

export const db = postgres<Contract>({
  contractJson,
  url: databaseEnv.DATABASE_URL,
});

export type Db = typeof db;
// The client db.transaction passes to its callback. Repository methods take `client: DbClient = this.db` as their
// last parameter, so the same method runs inside or outside a transaction.
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export type DbClient = Db | Tx;
// What a service needs to open a transaction. Tests pass a fake that calls the callback with a fake Tx.
export type TransactionRunner = Pick<Db, 'transaction'>;
