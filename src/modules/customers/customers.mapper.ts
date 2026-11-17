import { parseUtcTimestamp } from "../../common/timestamps.js";
import type { CustomerRow, ProfileUser } from "./customers.repository.js";
import type { CustomerProfileResponse } from "./customers.types.js";

export const toCustomerProfileResponse = (customer: CustomerRow, user: ProfileUser): CustomerProfileResponse => ({
  id: customer.id,
  email: user.email,
  firstName: customer.firstName,
  lastName: customer.lastName,
  phoneNumber: user.phoneNumber,
  profileImageUrl: customer.profileImageUrl,
  dateOfBirth: customer.dateOfBirth,
  gender: customer.gender,
  emailVerified: user.emailVerifiedAt !== null,
  createdAt: parseUtcTimestamp(customer.createdAt).toISOString(),
});
