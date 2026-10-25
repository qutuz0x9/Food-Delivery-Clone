import { AppError } from "./app-error.js";

// One class per HTTP error status the API documents. Feature errors extend these (see auth.errors.ts), so the error
// middleware only needs to know about AppError.

export class ValidationError extends AppError {
  constructor(fields: Readonly<Record<string, string>>, message = "Validation failed") {
    super(400, "VALIDATION_ERROR", message, fields);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", code = "UNAUTHORIZED") {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action", code = "FORBIDDEN") {
    super(403, code, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(404, code, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: string) {
    super(409, code, message);
  }
}
