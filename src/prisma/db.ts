import postgres from '@prisma/orm-postgres/runtime';
import { databaseEnv } from '../config/database-env.js';
import type { Contract } from './contract.js';
import contractJson from './contract.json' with { type: 'json' };

export const db = postgres<Contract>({
  contractJson,
  url: databaseEnv.DATABASE_URL,
});

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export type DbClient = Db | Tx;
export type TransactionRunner = Pick<Db, 'transaction'>;
