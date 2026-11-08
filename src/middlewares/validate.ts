import type { RequestHandler, Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export interface RequestSchemas {
  readonly body?: ZodType;
  readonly params?: ZodType;
  readonly query?: ZodType;
}

export interface ValidatedRequestData {
  params?: unknown;
  query?: unknown;
}

export const validate =
  (schemas: RequestSchemas): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    const validated: ValidatedRequestData = {};

    if (schemas.body) {
      // Express 5 leaves req.body undefined without a JSON body; {} gives one error per missing field.
      const result = schemas.body.safeParse(req.body ?? {});
      if (!result.success) return next(result.error);
      req.body = result.data;
    }
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) return next(result.error);
      validated.params = result.data;
    }
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) return next(result.error);
      validated.query = result.data;
    }

    res.locals["validated"] = validated;
    next();
  };
