# Stack and code conventions

## Stack

The stack is fixed. Do not propose other frameworks or libraries.

| Part | Choice |
| --- | --- |
| Runtime / framework | Node.js + Express |
| Language | **TypeScript** if `tsconfig.json` exists, otherwise **JavaScript**. For a new, empty project, ask once: TS or JS. |
| Database | PostgreSQL through **Prisma** |
| Validation | **Zod**, run by a `validate` middleware |
| Tests | **Vitest** + **Supertest** |
| Code style | **Classes with constructor injection**, wired once per module |
| Password hashing | the project's existing hasher, otherwise a small `PasswordHasher` class around `bcrypt` |

Check these in `package.json`. Don't guess.

- **Express 5:** errors thrown in async handlers reach the error handler automatically.
- **Express 4:** wrap async handlers with an `asyncHandler` helper.
- **Prisma:** follow the installed version and the `generator` block in `schema.prisma` for where the client is generated and how to import it.
- **Zod:** follow the installed major version (v3 and v4 APIs differ).
- **JavaScript projects:** match the module system (`"type": "module"` means ESM, otherwise CommonJS). Use JSDoc types only if the project already does.

## Default layout

If the project already has a layout, follow it and copy the naming of the closest existing feature. Otherwise use this layout. Use `.js` instead of `.ts` for JavaScript.

```txt
prisma/schema.prisma
src/
  app.ts                        createApp(): middleware, module routers, errorHandler last
  server.ts                     calls createApp() and listens
  lib/
    prisma.ts                   PrismaClient singleton + DbClient type
    password-hasher.ts
  common/
    errors/                     AppError base + BadRequest/Unauthorized/NotFound/Conflict errors
    middleware/
      validate.ts               Zod validation middleware
      error-handler.ts          turns errors into JSON responses
  modules/<module>/
    <module>.module.ts          wiring: new Repository → new Service → new Controller → router
    <module>.routes.ts          buildRouter(controller): routes + validate middleware
    <module>.controller.ts
    <module>.service.ts
    <entity>.repository.ts
    <module>.schemas.ts         Zod schemas + inferred input types
    <module>.errors.ts          feature errors (extend the common error classes)
    <module>.mapper.ts          entity → response object (never includes secrets)
    <module>.types.ts           response types
    __tests__/
      <module>.service.test.ts
      <module>.schemas.test.ts
      <module>.routes.test.ts
```

## Rules for code Claude writes

- **Controllers:**
  - Define methods as arrow-function properties, so `this` stays bound when they are passed to the router.
  - A controller only reads the validated input, calls the service, sets the status code, and sends JSON. No logic.
- **`validate` middleware:**
  - Takes `{ body?, params?, query? }` Zod schemas and uses `safeParse`.
  - On failure, it passes the error to `next`.
  - On success, it replaces `req.body` with the parsed data. Parsed `params` and `query` go on `res.locals.validated`, because `req.query` is read-only in Express 5.
- **`errorHandler`:**
  - `AppError` → its status code and `{ error: { code, message, details? } }`.
  - `ZodError` → 400 with the field issues.
  - Anything else → log it, then return 500 with a generic message.
  - **Do not map Prisma error codes here.** Translating database errors is a user concept. The plan says which layer does it.
- **`lib/prisma.ts`:**
  - Exports the client and `type DbClient = PrismaClient | Prisma.TransactionClient`.
  - Turns on query logging when `PRISMA_LOG_QUERIES=1`, for the SQL check in review.
  - Repository methods that may run inside a transaction take `db: DbClient = this.prisma` as the last parameter.
- **Wiring:**
  - `<module>.routes.ts` exports `buildRouter(controller)`.
  - `<module>.module.ts` creates the real instances and exports the router.
  - `app.ts` exports `createApp()` separately from `listen`, so Supertest can use it.
- **Response shape:** follow the project's existing shape. If there is none, success returns the resource as the JSON body and errors use `{ error: { code, message, details? } }`.
- **Comments: almost none.** The user wants clean code that explains itself, with no explanation comments:
  - Make the code clear instead: precise names for variables, methods and tests, small functions, named constants.
  - Write a comment only when the code **can't** say it: a non-obvious reason that would make a reader "fix" the code
    into a bug (a race, a database or library quirk, a security reason). One short line, never a paragraph.
  - Never: comments that repeat what the code does, file or class header essays, `(plan §N)` references, section
    banners, or comments in tests (the test name explains the test).
  - Explanations belong in the Build Log note, not in the code.

## LEARN-TODO formats

A user-owned piece gets **one comment line** in the code, the marker, and nothing else: no step comments, no goal, no
hints. The marker is easy to search for: `LEARN-TODO (<kind>, <stage>): <Name>`.

Everything the user needs to write the piece (the goal, the steps at the Guided stage, the helpers, fields and errors
to use, the tests to read) goes in the **To-Do note**, under that piece's heading (see `notes.md`).

- **Code that must exist to compile** (methods, foundations): the marker, then `throw new Error("LEARN-TODO: <Name>");`
- **Zod schemas:** the marker above the schema, and the shape with base types, so inferred types work everywhere. The
  rules themselves are listed in the To-Do note.
- **User-written tests:** the marker above `it.todo("<name>")`.
- **Extend changes:** the marker at the exact spot to change. Don't add a `throw`, so existing behavior keeps working.
  Update the tests so they fail until the change is made.

### What the stages change

The code looks the same at every stage. Only the To-Do note changes:

| Stage | Under the piece's heading in the To-Do note |
| --- | --- |
| Guided | the goal, **numbered steps** (one operation per step, what to do, not the code), and what you need |
| Unguided (and refreshers) | the goal and what you need, **no steps** |

### Examples (TypeScript; in JavaScript, drop the types)

A method:

```ts
async register(input: RegisterCustomerInput): Promise<CustomerResponse> {
  // LEARN-TODO (core, guided): AuthService.register
  throw new Error("LEARN-TODO: AuthService.register");
}
```

Zod rules:

```ts
// LEARN-TODO (core, guided): registerCustomerSchema rules
export const registerCustomerSchema = z.object({
  email: z.string(),
  password: z.string(),
  name: z.string(),
});
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
```

A user-written test:

```ts
// LEARN-TODO (test, guided): write this test
it.todo("throws EmailAlreadyExistsError when the email exists");
```

When a piece is finished (written by the user, or by Claude at their request), remove its `LEARN-TODO` line too.

## Tests Claude writes (Vitest)

- **Service unit tests:**
  - Use fake repositories and a fake hasher built with `vi.fn()`, passed through the constructor.
  - Use a fake Prisma client whose `$transaction` calls the callback with a fake transaction client.
  - To simulate database errors, reject with `Prisma.PrismaClientKnownRequestError` and the right code (e.g. `P2002` for a unique violation).
- **Schema tests:** `safeParse` with valid and invalid inputs, one case per rule.
- **Route tests (Supertest):** mount `buildRouter(new Controller(fakeService))` on a small Express app with the real `errorHandler`. These test routing, validation and error responses without a database.
- **Repository integration tests:** the user's repository pieces are the code most likely to hide bugs, because the service tests replace them with fakes. So:
  - **If a test database is configured** (`.env.test` with `DATABASE_URL`, e.g. the `db-test` Compose service), write integration tests for every repository method in the feature, the user's pieces included: they fail until the piece is written. Each test runs inside a transaction that is rolled back, so the database stays clean. Cover the found / not found cases, the soft-delete rule, and each error translation (e.g. a duplicate email becomes `EmailAlreadyExistsError`).
  - **If not**, say so in the Project check and propose setting it up once for the project: a Postgres test service in Docker Compose, `.env.test`, and a `test:db` script. Ask before adding it. Until then, the To-Do note gives a manual check for each untested piece.
- **No duplicates:** never write a test the user was assigned.

## Verify commands

- **Type check (TS only):** the `typecheck` script, or `npx tsc --noEmit`.
- **Tests:** the `test` script, or `npx vitest run`.
- **Expected type errors:** errors that are only "declared but never read" inside `LEARN-TODO` stubs are expected. Any other type error in Claude's code must be fixed.
