import type { PaymentMethod, PaymentMethodDetails, PaymentMethodResponse } from "./payments.types.js";

// Builds the response field by field, so a field added to PaymentMethodDetails later can't reach the client by accident.
export const toPaymentMethodResponse = (
  method: PaymentMethod,
  details: PaymentMethodDetails,
): PaymentMethodResponse => ({
  method,
  label: details.label,
  online: details.online,
});
