// The base class for every error the app throws on purpose. errorHandler turns it into
// `{ success: false, message, error: { code, fields? } }` with this status code.
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  // Field name → message, only for errors about specific request fields.
  readonly fields: Readonly<Record<string, string>> | undefined;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    fields?: Readonly<Record<string, string>>,
  ) {
    super(message);
    // LEARN-TODO (foundation, guided): AppError
    // 1. Set `name` to the real (sub)class name.
    this.name = this.constructor.name;
    // 2. Store statusCode, code and fields.
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.message = message;
  }
}
