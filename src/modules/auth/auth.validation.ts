import { z } from "zod";

// LEARN-TODO (core, guided): registerCustomerSchema rules
// - email: trimmed, valid email, at most 254 characters, case kept
// - password: 8 to 128 characters, not trimmed
// - firstName, lastName: trimmed, then 1 to 100 characters
// - phoneNumber: trimmed, E.164: "+", 8 to 15 digits, first digit not 0
// - messages: written for the client (shown under `fields`)
export const registerCustomerSchema = z.object({
  email: z.string().trim().email().max(254, "Email is required"),
  password: z.string().min(8).max(128),
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string().trim(),
});
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
