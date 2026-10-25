import express from "express";
import { type Express, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import SwaggerParser from "@apidevtools/swagger-parser";
import path from "path";
import { errorHandler } from "./middlewares/error-handler.js";
import { apiRouter } from "./routes.js";

const app: Express = express();

app.use(express.json());

const openApiPath = path.join(process.cwd(), "docs/api/openapi.yaml");
const openApiDocument = await SwaggerParser.bundle(openApiPath);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use("/api/v1", apiRouter);

// Last, so it catches errors from every route above.
app.use(errorHandler);

export default app;
