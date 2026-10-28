import { PublicPaymentsController } from "./controllers/public.controller.js";
import { PaymentsService } from "./payments.service.js";
import { buildPaymentMethodsRouter } from "./routes/public.routes.js";

// Wiring: the one place that creates the module's real instances. No repository yet: the payment methods are a
// constant, not a table.
export const paymentsService = new PaymentsService();

// Mounted at /api/v1/payment-methods by src/routes.ts.
export const paymentMethodsRouter = buildPaymentMethodsRouter(new PublicPaymentsController(paymentsService));
