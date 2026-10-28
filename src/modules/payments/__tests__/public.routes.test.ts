import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../../middlewares/error-handler.js";
import { PublicPaymentsController } from "../controllers/public.controller.js";
import type { PaymentsService } from "../payments.service.js";
import { buildPaymentMethodsRouter } from "../routes/public.routes.js";
import type { PaymentMethodResponse } from "../payments.types.js";

const paymentMethods: PaymentMethodResponse[] = [
  { method: "cash", label: "Cash on delivery", online: false },
  { method: "apple_pay", label: "Apple Pay", online: true },
];

// The real router, controller and errorHandler, with a fake PaymentsService.
const setup = (listMethods = vi.fn((): PaymentMethodResponse[] => paymentMethods)) => {
  const app = express();
  app.use(express.json());
  app.use(
    "/payment-methods",
    buildPaymentMethodsRouter(new PublicPaymentsController({ listMethods } as unknown as PaymentsService)),
  );
  app.use(errorHandler);
  return { app, listMethods };
};

describe("GET /payment-methods", () => {
  it("answers 200 with the payment methods in the envelope", async () => {
    const { app } = setup();

    const res = await request(app).get("/payment-methods");

    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({
      success: true,
      message: "Payment methods retrieved successfully",
      data: { paymentMethods },
    });
  });

  it("answers 200 with no token, and ignores an invalid one", async () => {
    const { app } = setup();

    const withoutToken = await request(app).get("/payment-methods");
    const withBadToken = await request(app).get("/payment-methods").set("Authorization", "Bearer not-a-real-token");

    expect(withoutToken.status).toBe(200);
    expect(withBadToken.status).toBe(200);
  });

  it("ignores unknown query parameters", async () => {
    const { app, listMethods } = setup();

    const res = await request(app).get("/payment-methods").query({ page: 2, online: "false" });

    expect(res.status).toBe(200);
    expect(res.body.data.paymentMethods).toStrictEqual(paymentMethods);
    expect(listMethods).toHaveBeenCalledWith();
  });

  it("answers 500 without details when the service throws", async () => {
    // A synchronous throw, like a bug inside listMethods.
    const { app } = setup(vi.fn((): PaymentMethodResponse[] => {
      throw new Error("Cannot read properties of undefined (reading 'label')");
    }));

    const res = await request(app).get("/payment-methods");

    expect(res.status).toBe(500);
    expect(res.body).toStrictEqual({
      success: false,
      message: "An unexpected error occurred",
      error: { code: "INTERNAL_SERVER_ERROR" },
    });
  });
});
