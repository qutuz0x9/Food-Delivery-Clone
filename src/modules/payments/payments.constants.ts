import type { PaymentMethod, PaymentMethodDetails } from "./payments.types.js";

// One entry per payment_method value. Record<PaymentMethod, ...> needs exactly one key per enum value, so adding or
// removing a value in the contract (then npm run contract:emit) breaks the build until this object matches.
export const PAYMENT_METHOD_DETAILS: Readonly<Record<PaymentMethod, PaymentMethodDetails>> = {
  cash: { label: "Cash on delivery", online: false },
  credit_card: { label: "Credit card", online: true },
  debit_card: { label: "Debit card", online: true },
  apple_pay: { label: "Apple Pay", online: true },
  google_pay: { label: "Google Pay", online: true },
  wallet: { label: "Wallet", online: true },
};
