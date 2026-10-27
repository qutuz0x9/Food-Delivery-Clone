import type { UserRow } from "./auth.repository.js";

// Role names as stored in identity.roles.name (src/scripts/seed.ts creates them). The lookup uses the upper-case
// normalizedName.
export const ROLE_NAMES = {
  admin: "Admin",
  customer: "Customer",
  restaurant: "Restaurant",
  driver: "Driver",
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

// docs/api/schemas/customer.yaml#/Customer
export interface CustomerResponse {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phoneNumber: string;
}

export interface IssuedRefreshToken {
  // The raw token goes to the client in a cookie and is never stored.
  readonly token: string;
  // SHA-256 of the token: the only form saved in refresh_tokens.
  readonly tokenHash: string;
  readonly expiresAt: Date;
}

// Facts about the HTTP request that the service records, without the service knowing about Express.
export interface RequestContext {
  readonly ipAddress: string | null;
}

export interface RegisterCustomerResult {
  readonly customer: CustomerResponse;
  readonly accessToken: string;
  readonly refreshToken: IssuedRefreshToken;
}

// Same shape as register's, so the controller answers both the same way.
export type LoginCustomerResult = RegisterCustomerResult;

// users.account_status values. Only "active" may log in; the others get a 403 with their own code.
export type AccountStatus = UserRow["accountStatus"];
export type InactiveAccountStatus = Exclude<AccountStatus, "active">;
