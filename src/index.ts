import app from "./app.js";
import dotenv from "dotenv";
import { logger } from "./config/logger.js";
dotenv.config();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info({ port: Number(PORT) }, `Server is running on port ${PORT}`);
  logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
