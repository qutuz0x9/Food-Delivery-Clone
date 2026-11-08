import type { DbClient } from "../../prisma/db.js";
import type { CustomerRow, CustomersRepository, NewCustomerProfile } from "./customers.repository.js";

export type CustomerProfile = CustomerRow;

export class CustomersService {
  private readonly customersRepository: CustomersRepository;

  constructor(customersRepository: CustomersRepository) {
    this.customersRepository = customersRepository;
  }

  async createProfile(data: NewCustomerProfile, client?: DbClient): Promise<CustomerProfile> {
    return this.customersRepository.createProfile(data, client);
  }

  async findProfileByUserId(userId: string): Promise<CustomerProfile | null> {
    return this.customersRepository.findByUserId(userId);
  }
}
