import { db } from "../../prisma/db.js";
import { CustomersRepository } from "./customers.repository.js";
import { CustomersService } from "./customers.service.js";

export const customersService = new CustomersService(new CustomersRepository(db));
