import { Router } from "express";
import { authRouter } from "./modules/auth/auth.module.js";
import { citiesRouter } from "./modules/cities/cities.module.js";

// Every module router, mounted under /api/v1 by app.ts.
export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/cities", citiesRouter);
