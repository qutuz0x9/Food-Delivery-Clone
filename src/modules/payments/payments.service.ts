import { PAYMENT_METHOD_DETAILS } from "./payments.constants.js";
import { toPaymentMethodResponse } from "./payments.mapper.js";
import type { PaymentMethod, PaymentMethodDetails, PaymentMethodResponse } from "./payments.types.js";

// Rules for the payments tables. Other modules reach it through ./index.js. The payment routes
// (POST /orders/:orderId/payment, /admin/payments) join it in later stages, with a repository.
export class PaymentsService {
  // GET /payment-methods: every method, offline first, then online by label (plan §2).
  listMethods(): PaymentMethodResponse[] {
    // Object.entries types every key as string; the Record type on the constant already guarantees PaymentMethod.
    const entries = Object.entries(PAYMENT_METHOD_DETAILS) as [PaymentMethod, PaymentMethodDetails][];

    // entries is a new array on every call, so sorting it never reorders the shared constant.
    return entries
      .map(([method, details]) => toPaymentMethodResponse(method, details))
      .sort((a, b) => Number(a.online) - Number(b.online) || a.label.localeCompare(b.label, "en"));
  }
}
