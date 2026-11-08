import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../common/errors/app-error.js";
import { logger } from "../config/logger.js";

// Express needs all 4 parameters to treat this as an error handler: keep _next.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.code,
        fields: err.fields,
      },
    });
    return;
  }
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.map(String).join(".");
      if (!(key in fields)) fields[key] = issue.message;
    }
    res.status(400).json({
      success: false,
      message: "Validation failed",
      error: { code: "VALIDATION_ERROR", fields },
    });
    return;
  }

  // res.err hands the error and its stack to requestLogger's line for this request.
  res.err = err;
  if (!req.log) logger.error({ err }, "unhandled error");
  res.status(500).json({
    success: false,
    message: "An unexpected error occurred",
    error: { code: "INTERNAL_SERVER_ERROR" },
  });
};
