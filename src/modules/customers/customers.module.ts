import { db } from "../../prisma/db.js";
import { CustomerProfileController } from "./controllers/customer.controller.js";
import { CustomersRepository } from "./customers.repository.js";
import { CustomersService } from "./customers.service.js";
import { buildCustomerRouter } from "./routes/customer.routes.js";

export const customersService = new CustomersService(new CustomersRepository(db));

export const customersRouter = buildCustomerRouter(new CustomerProfileController(customersService));
