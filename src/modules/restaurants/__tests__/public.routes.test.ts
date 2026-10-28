import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../../middlewares/error-handler.js";
import { PublicRestaurantsController } from "../controllers/public.controller.js";
import type { RestaurantsService } from "../restaurants.service.js";
import { buildCuisinesRouter } from "../routes/public.routes.js";

const cuisines = ["Burgers", "Desserts", "Grills"];

// The real router, controller and errorHandler, with a fake RestaurantsService: no database.
const setup = (listPublicCuisines = vi.fn(async (): Promise<string[]> => cuisines)) => {
  const app = express();
  app.use(express.json());
  app.use(
    "/cuisines",
    buildCuisinesRouter(new PublicRestaurantsController({ listPublicCuisines } as unknown as RestaurantsService)),
  );
  app.use(errorHandler);
  return { app, listPublicCuisines };
};

describe("GET /cuisines", () => {
  it("answers 200 with the cuisines in the envelope", async () => {
    const { app } = setup();

    const res = await request(app).get("/cuisines");

    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({
      success: true,
      message: "Cuisines retrieved successfully",
      data: { cuisines },
    });
  });

  it("ignores unknown query parameters", async () => {
    const { app, listPublicCuisines } = setup();

    const res = await request(app).get("/cuisines").query({ page: 2, city: "Cairo" });

    expect(res.status).toBe(200);
    expect(res.body.data.cuisines).toStrictEqual(cuisines);
    expect(listPublicCuisines).toHaveBeenCalledWith();
  });

  it("answers 500 without details when the service fails", async () => {
    const { app } = setup(vi.fn(async (): Promise<string[]> => {
      throw new Error("connect ECONNREFUSED 127.0.0.1:5432");
    }));

    const res = await request(app).get("/cuisines");

    expect(res.status).toBe(500);
    expect(res.body).toStrictEqual({
      success: false,
      message: "An unexpected error occurred",
      error: { code: "INTERNAL_SERVER_ERROR" },
    });
  });
});
