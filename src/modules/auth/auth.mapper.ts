import type { CustomerProfile } from "../customers/index.js";
import type { UserRow } from "./auth.repository.js";
import type { CustomerResponse } from "./auth.types.js";

// Field by field, so a new users column (or passwordHash) can never leak.
export const toCustomerResponse = (user: UserRow, customer: CustomerProfile): CustomerResponse => ({
  id: customer.id,
  email: user.email,
  firstName: customer.firstName,
  lastName: customer.lastName,
  phoneNumber: user.phoneNumber,
});
