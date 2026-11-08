import type { Scalars } from "@prisma/orm-postgres/family-contract/types";
import type { Models } from "../../prisma/contract.d.js";

export type PaymentMethod = Scalars<Models.public_Payment>["paymentMethod"];

export interface PaymentMethodDetails {
  readonly label: string;
  readonly online: boolean;
}

export interface PaymentMethodResponse {
  readonly method: PaymentMethod;
  readonly label: string;
  readonly online: boolean;
}
