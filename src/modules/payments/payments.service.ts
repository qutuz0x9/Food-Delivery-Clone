import { PAYMENT_METHOD_DETAILS } from "./payments.constants.js";
import { toPaymentMethodResponse } from "./payments.mapper.js";
import type { PaymentMethod, PaymentMethodDetails, PaymentMethodResponse } from "./payments.types.js";

export class PaymentsService {
  listMethods(): PaymentMethodResponse[] {
    // Object.entries types keys as string; the Record type already guarantees PaymentMethod.
    const entries = Object.entries(PAYMENT_METHOD_DETAILS) as [PaymentMethod, PaymentMethodDetails][];

    return entries
      .map(([method, details]) => toPaymentMethodResponse(method, details))
      .sort((a, b) => Number(a.online) - Number(b.online) || a.label.localeCompare(b.label, "en"));
  }
}
