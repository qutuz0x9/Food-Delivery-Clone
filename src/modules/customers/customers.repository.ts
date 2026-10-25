import { randomUUID } from "node:crypto";
import type { Scalars } from "@prisma/orm-postgres/family-contract/types";
import type { Models } from "../../prisma/contract.d.js";
import type { DbClient } from "../../prisma/db.js";

export type CustomerRow = Scalars<Models.public_Customer>;

export interface NewCustomerProfile {
  readonly userId: string;
  readonly firstName: string;
  readonly lastName: string;
}

export class CustomersRepository {
  private readonly db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  async createProfile(data: NewCustomerProfile, client: DbClient = this.db): Promise<CustomerRow> {
    // customers.id has no database default in the contract, so the app generates it.
    return client.orm.public.Customer.create({ id: randomUUID(), ...data });
  }
}
