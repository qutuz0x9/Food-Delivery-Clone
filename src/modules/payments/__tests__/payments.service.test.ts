import { describe, expect, it } from "vitest";
import contractJson from "../../../prisma/contract.json" with { type: "json" };
import { PAYMENT_METHOD_DETAILS } from "../payments.constants.js";
import { PaymentsService } from "../payments.service.js";

describe("PAYMENT_METHOD_DETAILS", () => {
  // Catches a contract.json emitted without regenerating contract.d.ts, which the type check can't see.
  it("covers every value of the contract's payment_method enum", () => {
    const enumValues = contractJson.storage.namespaces.public.entries.valueSet.payment_method.values;
    const keys = Object.keys(PAYMENT_METHOD_DETAILS);

    expect(keys).toHaveLength(enumValues.length);
    expect(keys).toEqual(expect.arrayContaining(enumValues));
  });
});

describe("PaymentsService", () => {
  describe("listMethods", () => {
    it("returns one item per method with method, label and online", () => {
      const service = new PaymentsService();

      const methods = service.listMethods();

      expect(methods).toHaveLength(6);
      expect(methods).toEqual(
        expect.arrayContaining([
          { method: "cash", label: "Cash on delivery", online: false },
          { method: "credit_card", label: "Credit card", online: true },
          { method: "debit_card", label: "Debit card", online: true },
          { method: "apple_pay", label: "Apple Pay", online: true },
          { method: "google_pay", label: "Google Pay", online: true },
          { method: "wallet", label: "Wallet", online: true },
        ]),
      );
    });

    it("puts offline methods first, then online methods by label", () => {
      const service = new PaymentsService();

      const methods = service.listMethods().map((item) => item.method);

      expect(methods).toStrictEqual(["cash", "apple_pay", "credit_card", "debit_card", "google_pay", "wallet"]);
    });

    it("returns the same order on every call, even if a caller changes its copy", () => {
      const service = new PaymentsService();
      const first = service.listMethods();
      const expected = [...first];

      first.reverse();

      expect(service.listMethods()).toStrictEqual(expected);
    });
  });
});
