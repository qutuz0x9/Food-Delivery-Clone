import type { Request, Response } from "express";
import type { PaymentsService } from "../payments.service.js";

// HTTP in and out for the public payment routes. No rules here: those live in PaymentsService.
export class PublicPaymentsController {
  private readonly paymentsService: PaymentsService;

  constructor(paymentsService: PaymentsService) {
    this.paymentsService = paymentsService;
  }

  // GET /payment-methods. No input: unknown query parameters are ignored. Synchronous: nothing is awaited.
  listMethods = (_req: Request, res: Response): void => {
    const paymentMethods = this.paymentsService.listMethods();

    res.status(200).json({
      success: true,
      message: "Payment methods retrieved successfully",
      data: { paymentMethods },
    });
  };
}
