import type { PaymentMethod, PaymentMethodDetails, PaymentMethodResponse } from "./payments.types.js";

export const toPaymentMethodResponse = (
  method: PaymentMethod,
  details: PaymentMethodDetails,
): PaymentMethodResponse => ({
  method,
  label: details.label,
  online: details.online,
});
