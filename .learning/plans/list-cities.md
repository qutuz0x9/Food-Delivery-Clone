# Plan: List Cities

Notes: `/home/qutuz0x9/MyData/Backend-Developer/CodeBase/04- Projects/Food Delivery Clone/03- Development/Features/03- List Cities/`
Branch: `feature/list-cities`

## 1. Goal and assumptions

Anyone (no login) gets the list of active cities. Clients use it to fill a "pick your city" list when a customer saves
an address, a restaurant adds a branch or a driver chooses a working city. The ids returned are what the API expects
as `cityId`.

- Only rows with `is_active = true`. Cities are deactivated, never deleted (`domain-rules.md`, "Cities and branches").
- Small reference table: no pagination, no filters, no search.
- The admin routes (`/admin/cities`) are a later feature: they need `authenticate` and the role guard (roadmap stage 3).

Project: TypeScript (ESM), Express 5, Prisma 8 (`@prisma/orm-postgres` rc.11), Zod 4, Vitest 4 + Supertest. Mirrors the
`auth` and `customers` modules; a small module keeps one controller and one routes file (`CLAUDE.md`). New
dependencies: none.

## 2. Endpoint contract

- `GET /api/v1/cities`, public (`security: []` in `docs/api/paths/city.yaml`, already documented).
- Request: no body, no query, no path parameters. Unknown query parameters (`?page=2`) and a body are **ignored**.
- Success `200`, cities sorted by `name`, then `country`:

```json
{
  "success": true,
  "message": "Cities retrieved successfully",
  "data": {
    "cities": [
      {
        "id": "9b6e3d20-2f7a-4d51-8c80-3a4b5c6d7e8f",
        "name": "Alexandria",
        "country": "Egypt"
      },
      {
        "id": "5e2a9c14-7b3d-4f68-8a01-9c4d6e8f0b21",
        "name": "Cairo",
        "country": "Egypt"
      },
      {
        "id": "7a4c1e92-0d5b-4b3f-9e68-1f2a3b4c5d6e",
        "name": "Giza",
        "country": "Egypt"
      }
    ]
  }
}
```

- No active city: `200` with `"cities": []`.

| Case                                 | Status | Error code / message                                     |
| ------------------------------------ | ------ | -------------------------------------------------------- |
| The query fails (database down, ...) | 500    | `INTERNAL_SERVER_ERROR` / "An unexpected error occurred" |

## 3. Request → response flow

1. `src/routes.ts` mounts the cities router at `/api/v1/cities`.
2. `cities.routes.ts`: `GET /` → `controller.list`. No `validate`: there is no input to check.
3. `cities.controller.ts`: calls `citiesService.listActive()`, answers 200 with the envelope. No logic.
4. `cities.service.ts`: asks the repository for the active cities and maps each row with `toCityResponse`. The
   service owns "what a city looks like to a client".
5. `cities.repository.ts`: one query on `cities`: filter on `isActive`, order by `name` then `country`. The only layer
   that talks to Prisma.
6. Back up: rows → `CityResponse[]` → JSON.
7. Errors: a failed query rejects in the repository, passes through the service and the controller untouched (Express
   5 forwards the rejected promise), and `errorHandler` turns it into the 500 envelope and hands the error to the log
   line. Nothing is caught on the way.

## 4. Files

| File                                      | Layer      | Who writes                             | Purpose                                            |
| ----------------------------------------- | ---------- | -------------------------------------- | -------------------------------------------------- |
| `src/modules/cities/cities.repository.ts` | repository | Claude (class), **You** (`findActive`) | the query on `cities`                              |
| `src/modules/cities/cities.service.ts`    | service    | Claude (class), **You** (`listActive`) | the use case: active cities, as responses          |
| `src/modules/cities/cities.mapper.ts`     | mapper     | Claude                                 | row → `CityResponse`, field by field               |
| `src/modules/cities/cities.types.ts`      | types      | Claude                                 | `CityResponse` (matches `schemas/city.yaml#/City`) |
| `src/modules/cities/cities.controller.ts` | controller | Claude                                 | HTTP in and out                                    |
| `src/modules/cities/cities.routes.ts`     | routes     | Claude                                 | `buildCitiesRouter(controller)`                    |
| `src/modules/cities/cities.module.ts`     | wiring     | Claude                                 | creates the instances, exports the router          |
| `src/modules/cities/index.ts`             | public API | Claude                                 | exports the service and types for other modules    |
| `src/routes.ts`                           | wiring     | Claude (edit)                          | mounts `/cities`                                   |
| `src/modules/cities/__tests__/*.test.ts`  | tests      | Claude                                 | see §9                                             |

`docs/api/` and `docs/requirements/APIs-Endpoints.md` already document `GET /cities`; no change expected.

## 5. Data model

No change. Reads `cities` (`db.orm.public.City`): `id` (uuid, PK, no default), `name` and `country`
(`VarChar(100)`, unique together: `cities_name_country_key`), `is_active` (bool, default `true`), `created_at`.

No new index: the table holds a few dozen rows, so Postgres reads it in full whatever the index. No migration.

## 6. Validation rules

| Field           | Rules                                                               | Where                         |
| --------------- | ------------------------------------------------------------------- | ----------------------------- |
| (none)          | the request has no input; unknown query keys and a body are ignored | no Zod schema                 |
| response fields | only `id`, `name`, `country`; never `is_active` or `created_at`     | mapper, called by the service |

## 7. Transaction and error design

- No transaction: one read, no writes.
- No error is caught or translated. A database error becomes a 500 in `errorHandler`; the client sees a generic
  message, the log line holds the real error.

## 8. Edge cases and security

1. No active cities (fresh database, or all deactivated) → `200` with `[]`, not `404`.
2. The database is down → `500` generic message; no SQL or stack trace in the body.
3. Two requests at once → both read; no locks, no race.
4. A deactivated city leaves this list; branches, drivers and addresses that point at it keep their `city_id`.
5. Attacker: no input, so nothing to inject. The data is public; the mapper keeps extra columns out.
6. Stable order: without `ORDER BY`, the row order can change between calls (an `UPDATE` can move a row).

## 9. Tests

| Test (describe › it)                                                                          | What it checks                           | Covers        | Written by |
| --------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------- | ---------- |
| CitiesRepository (database) › findActive › returns active cities and leaves out inactive ones | the `isActive` filter                    | `findActive`  | Claude     |
| CitiesRepository (database) › findActive › sorts by name, then country                        | the order                                | `findActive`  | Claude     |
| CitiesService › listActive › returns id, name and country only                                | the mapping, no `isActive` / `createdAt` | `listActive`  | Claude     |
| CitiesService › listActive › returns an empty list when no city is active                     | edge case 1                              | `listActive`  | Claude     |
| GET /cities › answers 200 with the cities in the envelope                                     | route, controller, status, shape         | Claude's code | Claude     |
| GET /cities › ignores unknown query parameters                                                | the decision in §2                       | Claude's code | Claude     |
| GET /cities › answers 500 without details when the service fails                              | `errorHandler` path                      | Claude's code | Claude     |

Test writing is **off** (0 features done before this one), so Claude writes all of them.

## 10. Your part

| #   | Piece                         | Kind                      | Stage        | What it must do                                           |
| --- | ----------------------------- | ------------------------- | ------------ | --------------------------------------------------------- |
| 1   | `CitiesRepository.findActive` | core: filter + pagination | Guided       | return the active cities, sorted by name then country     |
| 2   | `CitiesService.listActive`    | core: orchestration flow  | Guided       | get the active cities and return them as `CityResponse[]` |
| 3   | Error classes + errorHandler  | foundation                | explain-back | answer the 3 questions below at review                    |

Explain-back (read `src/common/errors/app-error.ts`, `src/common/errors/http-errors.ts`,
`src/middlewares/error-handler.ts` and `src/app.ts`):

1. The database is down and `findActive` rejects. Follow the error step by step until the client gets its 500. Why
   is there no `try/catch` in the controller?
   Answar: Becasue the database is down so it's not a module error or http error so the clinet when send request and server go for database to get cities but database down so server go to error handler and for the Internal server error
2. How does `errorHandler` tell an `AppError` from any other error, and why does an unknown error get a generic
   message instead of `err.message`?
   Answar: because other error inhirit from AppError and the handler check if the error is instance of appError or not first. because it's unkown so we can't determine from which it comes so give it generic message
3. Why does `errorHandler` take 4 parameters, and why is it the last `app.use` in `app.ts`?
   Answar: It should know the error to know it's type, then know the req,res,next because it's the last middleware should the app hit it if error happen.

Design rating for this round: **Strong** (0 must-fix gaps). Design stage: `questions` (Strong rounds: 1).

## 11. Think before you code

- Your repository returns full rows and the mapper picks 3 fields. What would change if the repository selected only
  `id`, `name` and `country`? Which return type would it have then?
- Two cities share a name in different countries (Alexandria, Egypt and Alexandria, USA). What does the client see,
  and does your sort still give the same order every time?
- Later, the admin list (`GET /admin/cities`) shows inactive cities too. Would you add a parameter to `findActive`,
  or write a second method? Why?
