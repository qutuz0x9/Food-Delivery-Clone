import type { UserRow } from "./auth.repository.js";

export const ROLE_NAMES = {
  admin: "Admin",
  customer: "Customer",
  restaurant: "Restaurant",
  driver: "Driver",
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

export interface AuthContext {
  readonly userId: string;
  readonly role: RoleName;
}

export interface CustomerResponse {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phoneNumber: string;
}

export interface IssuedRefreshToken {
  readonly id: string;
  readonly token: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
}

export interface RequestContext {
  readonly ipAddress: string | null;
}

export interface RegisterCustomerResult {
  readonly customer: CustomerResponse;
  readonly accessToken: string;
  readonly refreshToken: IssuedRefreshToken;
}

export type LoginCustomerResult = RegisterCustomerResult;

export interface RefreshCustomerResult {
  readonly accessToken: string;
  readonly refreshToken: IssuedRefreshToken;
}

export const REVOKED_REASONS = {
  rotated: "rotated",
  reuseDetected: "reuse_detected",
  logout: "logout",
} as const;

export type RevokedReason = (typeof REVOKED_REASONS)[keyof typeof REVOKED_REASONS];

export type AccountStatus = UserRow["accountStatus"];
export type InactiveAccountStatus = Exclude<AccountStatus, "active">;
