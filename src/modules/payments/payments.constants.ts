import type { PaymentMethod, PaymentMethodDetails } from "./payments.types.js";

// Record<PaymentMethod, ...> fails the build until every payment_method value has an entry.
export const PAYMENT_METHOD_DETAILS: Readonly<Record<PaymentMethod, PaymentMethodDetails>> = {
  cash: { label: "Cash on delivery", online: false },
  credit_card: { label: "Credit card", online: true },
  debit_card: { label: "Debit card", online: true },
  apple_pay: { label: "Apple Pay", online: true },
  google_pay: { label: "Google Pay", online: true },
  wallet: { label: "Wallet", online: true },
};
