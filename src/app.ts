import express from "express";
import { type Express, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import SwaggerParser from "@apidevtools/swagger-parser";
import path from "path";
const app: Express = express();

app.use(express.json());

// Swagger setup
// swagger-ui-express serves the spec as an in-memory object, so external
// $refs (paths/schemas/responses split across files) must be bundled first.
const openApiPath = path.join(process.cwd(), "docs/api/openapi.yaml");
const openApiDocument = await SwaggerParser.bundle(openApiPath);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Root route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, world!");
});

export default app;
