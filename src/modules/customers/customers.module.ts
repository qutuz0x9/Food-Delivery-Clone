import { db } from "../../prisma/db.js";
import { CustomersRepository } from "./customers.repository.js";
import { CustomersService } from "./customers.service.js";

// Wiring: the one place that creates the module's real instances.
export const customersService = new CustomersService(new CustomersRepository(db));
