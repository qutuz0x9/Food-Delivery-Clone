import { PublicPaymentsController } from "./controllers/public.controller.js";
import { PaymentsService } from "./payments.service.js";
import { buildPaymentMethodsRouter } from "./routes/public.routes.js";

export const paymentsService = new PaymentsService();

export const paymentMethodsRouter = buildPaymentMethodsRouter(new PublicPaymentsController(paymentsService));
