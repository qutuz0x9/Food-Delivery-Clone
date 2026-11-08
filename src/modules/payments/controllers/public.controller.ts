import type { Request, Response } from "express";
import type { PaymentsService } from "../payments.service.js";

export class PublicPaymentsController {
  private readonly paymentsService: PaymentsService;

  constructor(paymentsService: PaymentsService) {
    this.paymentsService = paymentsService;
  }

  listMethods = (_req: Request, res: Response): void => {
    const paymentMethods = this.paymentsService.listMethods();

    res.status(200).json({
      success: true,
      message: "Payment methods retrieved successfully",
      data: { paymentMethods },
    });
  };
}
