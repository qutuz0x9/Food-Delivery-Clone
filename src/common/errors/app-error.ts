export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly fields: Readonly<Record<string, string>> | undefined;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    fields?: Readonly<Record<string, string>>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.message = message;
  }
}
