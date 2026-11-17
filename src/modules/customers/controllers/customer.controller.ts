import type { Request, Response } from "express";
import type { CustomersService } from "../customers.service.js";

export class CustomerProfileController {
  private readonly customersService: CustomersService;

  constructor(customersService: CustomersService) {
    this.customersService = customersService;
  }

  getMe = async (req: Request, res: Response): Promise<void> => {
    if (!req.auth) throw new Error("getMe ran without authenticate before it");
    const customer = await this.customersService.getProfile(req.auth.userId);

    res.status(200).json({
      success: true,
      message: "Customer profile retrieved successfully",
      data: { customer },
    });
  };
}
