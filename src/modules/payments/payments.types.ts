import type { Scalars } from "@prisma/orm-postgres/family-contract/types";
import type { Models } from "../../prisma/contract.d.js";

// The payment_method enum of src/prisma/contract.prisma ("cash" | "credit_card" | ...). Derived from the generated
// contract instead of written by hand, so it can't drift from the payments.payment_method column.
export type PaymentMethod = Scalars<Models.public_Payment>["paymentMethod"];

// What the enum doesn't store: the name shown to the customer and how the method is paid.
export interface PaymentMethodDetails {
  readonly label: string;
  // true: paid through POST /orders/{orderId}/payment. false: paid to the driver on delivery (cash).
  readonly online: boolean;
}

// docs/api/schemas/payment.yaml#/PaymentMethodOption
export interface PaymentMethodResponse {
  readonly method: PaymentMethod;
  readonly label: string;
  readonly online: boolean;
}
