import type { CustomerProfile } from "../customers/index.js";
import type { UserRow } from "./auth.repository.js";
import type { CustomerResponse } from "./auth.types.js";

// Builds the response field by field, so a new column on users (or passwordHash) can never reach the client by
// accident. `id` is the customer profile's id, not the user's.
export const toCustomerResponse = (user: UserRow, customer: CustomerProfile): CustomerResponse => ({
  id: customer.id,
  email: user.email,
  firstName: customer.firstName,
  lastName: customer.lastName,
  phoneNumber: user.phoneNumber,
});
