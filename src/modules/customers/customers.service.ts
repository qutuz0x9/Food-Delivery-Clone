import type { DbClient } from "../../prisma/db.js";
import { CustomerNotFoundError } from "./customers.errors.js";
import { toCustomerProfileResponse } from "./customers.mapper.js";
import type {
  CustomerRow,
  CustomersRepository,
  NewCustomerProfile,
} from "./customers.repository.js";
import type { CustomerProfileResponse } from "./customers.types.js";

export type CustomerProfile = CustomerRow;

export class CustomersService {
  private readonly customersRepository: CustomersRepository;

  constructor(customersRepository: CustomersRepository) {
    this.customersRepository = customersRepository;
  }

  async createProfile(
    data: NewCustomerProfile,
    client?: DbClient,
  ): Promise<CustomerProfile> {
    return this.customersRepository.createProfile(data, client);
  }

  async findProfileByUserId(userId: string): Promise<CustomerProfile | null> {
    return this.customersRepository.findByUserId(userId);
  }

  async getProfile(userId: string): Promise<CustomerProfileResponse> {
    const customer = await this.customersRepository.findProfileByUserId(userId);
    if (!customer || !customer.user) throw new CustomerNotFoundError();

    return toCustomerProfileResponse(customer, customer.user);
  }
}
