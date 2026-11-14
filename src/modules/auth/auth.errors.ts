import { ConflictError, ForbiddenError, UnauthorizedError } from "../../common/errors/http-errors.js";
import type { InactiveAccountStatus } from "./auth.types.js";

// One error for unknown email, deleted account and wrong password, so emails can't be enumerated.
export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super("Invalid email or password", "INVALID_CREDENTIALS");
  }
}

const ACCOUNT_NOT_ACTIVE: Readonly<Record<InactiveAccountStatus, { code: string; message: string }>> = {
  inactive: { code: "ACCOUNT_INACTIVE", message: "This account is inactive" },
  locked: { code: "ACCOUNT_LOCKED", message: "This account is locked" },
  suspended: { code: "ACCOUNT_SUSPENDED", message: "This account has been suspended" },
};

export class AccountNotActiveError extends ForbiddenError {
  constructor(status: InactiveAccountStatus) {
    super(ACCOUNT_NOT_ACTIVE[status].message, ACCOUNT_NOT_ACTIVE[status].code);
  }
}

export class NotACustomerError extends ForbiddenError {
  constructor() {
    super();
  }
}

export class InvalidRefreshTokenError extends UnauthorizedError {
  constructor(reason: "missing" | "invalid" = "invalid") {
    super(
      reason === "missing" ? "Refresh token is required" : "Your session has expired. Please log in again",
      "INVALID_REFRESH_TOKEN",
    );
  }
}

export class InvalidAccessTokenError extends UnauthorizedError {
  // reason is a Union type it should be missing or invalid, if no value the default is invalid
  // "missing":Ok - "invalid": Ok - "": Ok - "expired": compile error: not one of the two values
  constructor(reason: "missing" | "invalid" = "invalid") {
    super(reason === "missing" ? "Access token is required" : "Access token is invalid", "INVALID_ACCESS_TOKEN");
  }
}

export class AccessTokenExpiredError extends UnauthorizedError {
  constructor() {
    super("Access token has expired", "ACCESS_TOKEN_EXPIRED");
  }
}

export class EmailAlreadyExistsError extends ConflictError {
  constructor() {
    super("Email address is already registered", "EMAIL_ALREADY_EXISTS");
  }
}

export class PhoneNumberInUseError extends ConflictError {
  constructor() {
    super("Phone number is already registered", "VALUE_ALREADY_IN_USE");
  }
}

export class SqlQueryError extends ConflictError {
  constructor() {
    super("unique violation: SqlQueryError with sqlState", "UNIQE_VIOLATION");
  }
}
