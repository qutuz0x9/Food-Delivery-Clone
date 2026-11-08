import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { pinoHttp } from "pino-http";
import { logger } from "../config/logger.js";

// originalUrl, because a mounted router shortens req.url.
const requestLine = (
  req: IncomingMessage & { originalUrl?: string },
  res: ServerResponse,
  responseTime: number,
): string =>
  `${req.method} ${req.originalUrl ?? req.url} ${res.statusCode} ${Math.round(responseTime)}ms`;

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const incoming = req.headers["x-request-id"];
    const id =
      typeof incoming === "string" &&
      incoming.length > 0 &&
      incoming.length <= 100
        ? incoming
        : randomUUID();
    res.setHeader("X-Request-Id", id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: requestLine,
  // pino-http passes responseTime here too, but its types leave it out.
  customErrorMessage: (req, res, _err, responseTime?: number) =>
    requestLine(req, res, responseTime ?? 0),
  autoLogging: { ignore: (req) => req.url?.startsWith("/api-docs") ?? false },
});
