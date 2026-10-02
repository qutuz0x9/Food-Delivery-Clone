import type { Varchar } from "@prisma/orm-postgres/target/codec-types";
import { db } from "../prisma/db.js";

// Prisma 8 types VarChar(100) columns with a brand so a length limit cannot be skipped by accident. The brand exists
// only at compile time, so this helper does the real check and then tells the type system it was done.
const varchar100 = (value: string): Varchar<100> => {
  if (value.length > 100) throw new Error(`Value is ${value.length} characters, the column allows 100: ${value}`);
  return value as Varchar<100>;
};

// Reference data the platform needs before anything else can exist: every branch, driver and delivery address
// points at a city. Safe to run more than once - a city that is already there is left alone, so edits made
// through the admin API are never overwritten.
//
// The ids match the ones used in the examples in docs/api/, so what Swagger UI shows is what is in the database.
const CITIES = [
  { id: "5e2a9c14-7b3d-4f68-8a01-9c4d6e8f0b21", name: "Cairo", country: "Egypt" },
  { id: "7a4c1e92-0d5b-4b3f-9e68-1f2a3b4c5d6e", name: "Giza", country: "Egypt" },
  { id: "9b6e3d20-2f7a-4d51-8c80-3a4b5c6d7e8f", name: "Alexandria", country: "Egypt" },
];

for (const city of CITIES) {
  const name = varchar100(city.name);
  const country = varchar100(city.country);
  const existing = await db.orm.public.City.where({ name, country }).first();
  if (existing) {
    console.log(`City already exists: ${city.name}, ${city.country}`);
    continue;
  }
  await db.orm.public.City.create({ id: city.id, name, country });
  console.log(`Created city: ${city.name}, ${city.country}`);
}

await db.close();
