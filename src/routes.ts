import { Router } from "express";
import { requireRole } from "./middlewares/require-role.js";
import { authRouter } from "./modules/auth/auth.module.js";
import { authenticate, ROLE_NAMES } from "./modules/auth/index.js";
import { citiesRouter } from "./modules/cities/cities.module.js";
import { customersRouter } from "./modules/customers/customers.module.js";
import { paymentMethodsRouter } from "./modules/payments/payments.module.js";
import { cuisinesRouter } from "./modules/restaurants/restaurants.module.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
// Guarded here, not in the customers module: auth.module imports customers, so the reverse import would be circular.
apiRouter.use("/customers", authenticate, requireRole(ROLE_NAMES.customer), customersRouter);
apiRouter.use("/cities", citiesRouter);
apiRouter.use("/payment-methods", paymentMethodsRouter);
apiRouter.use("/cuisines", cuisinesRouter);
