import { z } from "zod";
const E164_PHONE = /^\+[1-9]\d{7,14}$/;
// LEARN-TODO (core, guided): registerCustomerSchema rules
// - email: trimmed, valid email, at most 254 characters, case kept
// - password: 8 to 128 characters, not trimmed
// - firstName, lastName: trimmed, then 1 to 100 characters
// - phoneNumber: trimmed, E.164: "+", 8 to 15 digits, first digit not 0
// - messages: written for the client (shown under `fields`)
export const registerCustomerSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254, "Email must be at most 254 characters") // ← changed message
    .pipe(z.email("Invalid email address")), // ← changed: z.email() via pipe
  password: z
    .string()
    .min(8, "Password must be at least 8 characters") // ← changed: message
    .max(128, "Password must be at most 128 characters"), // ← changed: message
  firstName: z
    .string()
    .trim() // ← new
    .min(1, "First name is required") // ← new
    .max(100, "First name must be at most 100 characters"), // ← new
  lastName: z
    .string()
    .trim() // ← new
    .min(1, "Last name is required") // ← new
    .max(100, "Last name must be at most 100 characters"), // ← new
  phoneNumber: z
    .string()
    .trim()
    .regex(
      E164_PHONE,
      "Phone number must be in E.164 format, e.g. +201234567890",
    ), // ← new
});
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
