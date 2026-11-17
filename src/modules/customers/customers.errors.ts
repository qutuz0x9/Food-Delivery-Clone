import { NotFoundError } from "../../common/errors/http-errors.js";

export class CustomerNotFoundError extends NotFoundError {
  constructor() {
    super("Customer profile not found", "CUSTOMER_NOT_FOUND");
  }
}
