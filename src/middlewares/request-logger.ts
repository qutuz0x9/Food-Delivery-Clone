import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { pinoHttp } from "pino-http";
import { logger } from "../config/logger.js";

// "GET /api/v1/cities 200 12ms" instead of "request completed". originalUrl, because a mounted router shortens req.url.
const requestLine = (
  req: IncomingMessage & { originalUrl?: string },
  res: ServerResponse,
  responseTime: number,
): string =>
  `${req.method} ${req.originalUrl ?? req.url} ${res.statusCode} ${Math.round(responseTime)}ms`;

// One log line per request, at the level its status deserves, tagged with a request id. The id comes from the
// caller's X-Request-Id header when there is one, and is always sent back in that header, so a user's error report
// can be matched to the server's log. Handlers log through `req.log`, which carries the same id.
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
  // pino-http passes responseTime here too (logger.js), but its types leave it out, so it's declared optional.
  customErrorMessage: (req, res, _err, responseTime?: number) =>
    requestLine(req, res, responseTime ?? 0),
  // Swagger UI loads many files per page; their lines would hide the API's.
  autoLogging: { ignore: (req) => req.url?.startsWith("/api-docs") ?? false },
});
