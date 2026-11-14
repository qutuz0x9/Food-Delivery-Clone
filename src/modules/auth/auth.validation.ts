import { z } from "zod";
import { ROLE_NAMES } from "./auth.types.js";

const E164_PHONE = /^\+[1-9]\d{7,14}$/;

export const registerCustomerSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254, "Email must be at most 254 characters")
    .pipe(z.email("Invalid email address")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name must be at most 100 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name must be at most 100 characters"),
  phoneNumber: z
    .string()
    .trim()
    .regex(
      E164_PHONE,
      "Phone number must be in E.164 format, e.g. +201234567890",
    ),
});
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;

export const loginCustomerSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254, "Email must be at most 254 characters")
    .pipe(z.email("Invalid email address")),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password must be at most 128 characters"),
});
export type LoginCustomerInput = z.infer<typeof loginCustomerSchema>;

export const accessTokenClaimsSchema = z.object({
  sub: z.uuid(),
  role: z.enum(ROLE_NAMES),
});
export type AccessTokenPayload = z.infer<typeof accessTokenClaimsSchema>;
