import { ConflictError, ForbiddenError, UnauthorizedError } from "../../common/errors/http-errors.js";
import type { InactiveAccountStatus } from "./auth.types.js";

// Codes match docs/api/responses/common.yaml (#/Conflict, #/Unauthorized, #/Forbidden).

// One answer for "no such email", "deleted account" and "wrong password", so it never reveals which emails exist.
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

// Only thrown after the password matched: the caller has proven who they are, so the status can be told.
export class AccountNotActiveError extends ForbiddenError {
  constructor(status: InactiveAccountStatus) {
    super(ACCOUNT_NOT_ACTIVE[status].message, ACCOUNT_NOT_ACTIVE[status].code);
  }
}

// The right password, but for an account with no customer profile (a driver, restaurant or admin).
export class NotACustomerError extends ForbiddenError {
  constructor() {
    super();
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
