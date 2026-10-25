import type { DbClient } from "../../prisma/db.js";
import type { CustomerRow, CustomersRepository, NewCustomerProfile } from "./customers.repository.js";

export type CustomerProfile = CustomerRow;

// Rules for the customers table. Other modules reach it through ../customers/index.js. Registration creates the
// profile here, passing its own transaction client so the profile commits or rolls back with the user.
export class CustomersService {
  private readonly customersRepository: CustomersRepository;

  constructor(customersRepository: CustomersRepository) {
    this.customersRepository = customersRepository;
  }

  async createProfile(data: NewCustomerProfile, client?: DbClient): Promise<CustomerProfile> {
    return this.customersRepository.createProfile(data, client);
  }
}
