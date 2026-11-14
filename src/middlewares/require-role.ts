import type { RequestHandler } from "express";
import { ForbiddenError } from "../common/errors/http-errors.js";
import type { RoleName } from "../modules/auth/auth.types.js";

export const requireRole =
  (...allowedRoles: [RoleName, ...RoleName[]]): RequestHandler =>
  (req, _res, next) => {
    // Fails closed: without authenticate there is no caller, and next() would open the route to anyone.
    if (!req.auth) throw new Error("requireRole ran without authenticate before it");
    if (!allowedRoles.includes(req.auth.role)) throw new ForbiddenError();
    next();
  };
