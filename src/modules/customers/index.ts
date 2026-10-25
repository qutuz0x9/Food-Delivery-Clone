// Public API of the customers module: other modules import only from here, never the repository.
export { customersService } from "./customers.module.js";
export type { CustomersService, CustomerProfile } from "./customers.service.js";
export type { NewCustomerProfile } from "./customers.repository.js";
