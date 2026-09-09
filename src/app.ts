import express from "express";
import { type Express, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import fs from "fs";
import path from "path";
const app: Express = express();

app.use(express.json());

// Swagger setup
const openApiPath = path.join(process.cwd(), "docs/api/openapi.yaml");
const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, "utf8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Root route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, world!");
});

export default app;
