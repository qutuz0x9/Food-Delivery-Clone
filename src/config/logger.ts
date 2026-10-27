import "dotenv/config";
import { pino, type Logger } from "pino";
import { z } from "zod";

// The app's one logger. Reads only its own two settings (not env.ts), so tests and scripts can import it without the
// app's secrets.
const loggerEnv = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
  })
  .parse(process.env);

const isDevelopment = loggerEnv.NODE_ENV === "development";

export const logger: Logger = pino({
  // Tests stay quiet unless LOG_LEVEL asks for output.
  level: loggerEnv.LOG_LEVEL ?? (loggerEnv.NODE_ENV === "test" ? "silent" : "info"),
  // Never write secrets to a log: credentials in headers, cookies, and any password or token field.
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
    ],
    censor: "[redacted]",
  },
  // Development: one readable, colored line per event. The req/res objects are hidden because the request line
  // (requestLogger's message) already says what matters; error stacks still print in full. Production: one JSON line
  // per event, with every field, for Docker and log tools.
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname,req,res,responseTime",
        singleLine: true,
      },
    },
  }),
});
