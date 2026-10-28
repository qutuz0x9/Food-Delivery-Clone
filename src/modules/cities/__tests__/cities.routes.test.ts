import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../../middlewares/error-handler.js";
import { CitiesController } from "../cities.controller.js";
import { buildCitiesRouter } from "../cities.routes.js";
import type { CitiesService } from "../cities.service.js";
import type { CityResponse } from "../cities.types.js";

const cities: CityResponse[] = [
  { id: "9b6e3d20-2f7a-4d51-8c80-3a4b5c6d7e8f", name: "Alexandria", country: "Egypt" },
  { id: "5e2a9c14-7b3d-4f68-8a01-9c4d6e8f0b21", name: "Cairo", country: "Egypt" },
];

// The real router, controller and errorHandler, with a fake CitiesService: no database.
const setup = (listActive = vi.fn(async (): Promise<CityResponse[]> => cities)) => {
  const app = express();
  app.use(express.json());
  app.use("/cities", buildCitiesRouter(new CitiesController({ listActive } as unknown as CitiesService)));
  app.use(errorHandler);
  return { app, listActive };
};

describe("GET /cities", () => {
  it("answers 200 with the cities in the envelope", async () => {
    const { app } = setup();

    const res = await request(app).get("/cities");

    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({
      success: true,
      message: "Cities retrieved successfully",
      data: { cities },
    });
  });

  it("ignores unknown query parameters", async () => {
    const { app, listActive } = setup();

    const res = await request(app).get("/cities").query({ page: 2, foo: "bar" });

    expect(res.status).toBe(200);
    expect(res.body.data.cities).toStrictEqual(cities);
    expect(listActive).toHaveBeenCalledWith();
  });

  it("answers 500 without details when the service fails", async () => {
    const { app } = setup(vi.fn(async (): Promise<CityResponse[]> => {
      throw new Error("connect ECONNREFUSED 127.0.0.1:5432");
    }));

    const res = await request(app).get("/cities");

    expect(res.status).toBe(500);
    expect(res.body).toStrictEqual({
      success: false,
      message: "An unexpected error occurred",
      error: { code: "INTERNAL_SERVER_ERROR" },
    });
  });
});
