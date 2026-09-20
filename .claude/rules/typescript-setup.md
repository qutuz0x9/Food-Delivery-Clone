---
paths:
  - "src/**/*.ts"
  - "tsconfig.json"
---

# TypeScript Conventions

The package is ESM (`"type": "module"`, `module: nodenext`), and both `tsc` and `tsx` are used, so the config is
stricter than a typical Express project. `strict` is on, so implicit `any` and unchecked `null`/`undefined` fail the
build.

## Module and Compiler Setup

- Write relative imports with a `.js` extension (`import app from "./app.js"`), even though the source is `.ts`.
  `nodenext` requires an explicit extension, and `rewriteRelativeImportExtensions` would also accept `.ts`, but `.js`
  is the convention here.
- `verbatimModuleSyntax`: use `import type` / `type` modifiers for type-only imports (oxlint enforces it).
- `erasableSyntaxOnly`: no `enum`, `namespace` or constructor parameter properties. Use `as const` objects and
  union types instead (this matters when mirroring the DB enums such as `order_status`).
- `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are on, so `arr[0]` is `T | undefined` and optional
  props can't be assigned `undefined` explicitly.
- `src/app.ts` uses top-level `await` to bundle the split OpenAPI files with `SwaggerParser.bundle` at startup.
  `nodemon.json` watches `docs/api/` too, so a spec edit restarts the server. A spec that fails to bundle stops the
  app from booting.

## Types

- Interfaces for object shapes (DTOs, service inputs). `type` aliases for unions, intersections and anything inferred
  from zod (`z.infer<typeof schema>`).
- No `any`: use `unknown` and narrow it (oxlint's `typescript/no-explicit-any` warns).
- Mirror DB enums (`order_status`, ...) as an `as const` object plus a derived union type
  (`type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]`).
- Explicit return types on exported functions, especially in services and repositories, so Prisma types don't leak
  across layer boundaries.
- Export a type from the file that implements it.

## Patterns

- Discriminated unions for state that has variants (e.g. a result that is `{ ok: true, ... } | { ok: false, ... }`).
- `readonly` arrays and properties wherever nothing mutates them.
- Generics for reusable helpers (pagination, repository or response wrappers) instead of `any` or casts.
- Utility types (`Partial`, `Required`, `Pick`, `Omit`) for derived shapes such as update DTOs. Don't rely on
  `Omit<PrismaModel, "passwordHash">` to keep secrets out of responses — build the response DTO explicitly
  (see `coding-conventions.md`).

## Code Style

- `??` over `||` for defaults (`||` swallows `0` and `""`), and `?.` for optional access.

## File Organization

- One export per file when possible. The exceptions are files that group related declarations by design:
  `<feature>.validation.ts` (zod schemas and their inferred DTO types), `<feature>.types.ts` and `*.routes.ts`.
- Co-locate a type with the code that uses it. Once two files in a feature need it, move it to `<feature>.types.ts`
  (see "Planned Architecture" in `CLAUDE.md`).
- Barrel files (`index.ts`) are for a module's public API only: at most one per module, at
  `src/modules/<feature>/index.ts`, exporting what other modules may use (its service and types) so they don't reach
  into internals. Import it with the full path (`../menu/index.js`), since `nodenext` doesn't resolve bare
  directories. Never re-export a repository through it, and add no barrels anywhere else (subfolders, `common/`,
  `middlewares/`).

## Checking Your Work

- `npm run build` — compile with `tsc` (also produces `dist/`).
- `npx tsc --noEmit` — type-check only. There is no `typecheck` script.
- `npm run lint` — oxlint with type-aware rules, not ESLint.
