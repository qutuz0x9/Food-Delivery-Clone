import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../common/errors/app-error.js";

// Last middleware in app.ts. Its 4 parameters mark it as an error handler, so keep `_next`.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // LEARN-TODO (foundation, guided): errorHandler
  // 1. AppError → its status code and the error envelope (no `fields` when empty).
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.code,
        fields: err.fields,
      },
    });
  }
  // ZodError (from validate) → 400 with the first message per field.
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      // Nested paths become "profile.name". String() because a path segment may also be a number or a symbol.
      const key = issue.path.map(String).join(".");
      // A field can break several rules; the client gets the first message only.
      if (!(key in fields)) fields[key] = issue.message;
    }
    res.status(400).json({
      success: false,
      message: "Validation failed",
      error: { code: "VALIDATION_ERROR", fields },
    });
    return;
  }

  // Anything else is a bug or an outage. Log everything for us; tell the client nothing about the cause.
  console.error(err);
  res.status(500).json({
    success: false,
    message: "An unexpected error occurred",
    error: { code: "INTERNAL_SERVER_ERROR" },
  });
};
