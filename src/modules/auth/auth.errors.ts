import { ConflictError } from "../../common/errors/http-errors.js";

// Codes match docs/api/responses/common.yaml#/Conflict.

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
