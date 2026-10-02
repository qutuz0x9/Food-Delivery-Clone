---
name: openapi-generator
description: Document missing API endpoints in the split OpenAPI 3.0.3 spec under docs/api/, deriving them from src/prisma/contract.prisma. Use when the user wants to add or extend OpenAPI docs for a domain or feature.
argument-hint: "[domain-or-feature]"
allowed-tools: Read, Edit, Write, Grep, Glob, Bash(npm run lint:api)
---

# OpenAPI Generator Skill

Derive the endpoints a domain needs from `src/prisma/contract.prisma` and document them in the split OpenAPI spec under
`docs/api/`. The spec already exists, so this skill **extends and merges**. It never regenerates or overwrites.

The conventions live in `.claude/rules/open-api-rules.md` and `CLAUDE.md` ("OpenAPI Spec (`docs/api/`)"). Read the rules
file first and follow it exactly. This skill only describes the workflow.

## Usage

```
/openapi-generator
/openapi-generator <domain-or-feature>    # e.g. identity verification, dispatch monitoring
```

## Behavior

1. **Read the current spec**
   - Read `docs/api/openapi.yaml`, list `docs/api/paths/`, `schemas/`, `responses/`, and read the shared
     `schemas/common.yaml` and `responses/common.yaml`.
   - Read a finished domain (e.g. `paths/driver.yaml`) and copy its style.

2. **Work out what is missing**
   - From the contract models for the domain and the actor that owns them, list the routes they need: reading,
     creating, changing and deactivating records, plus the state changes the enums and CHECK constraints imply.
   - Compare with the routes already in the root `paths` and with `docs/requirements/APIs-Endpoints.md`. Skip what is
     already documented and report it as existing.
   - Variants of an existing list (filters, search, sorting) are query parameters on that operation, not new paths.

3. **Check the contract**
   - Read `src/prisma/contract.prisma` (the only source of truth) for exact field names, types, limits, constraints
     and enum values. Never use `docs/dbdesign/` or `docs/requirements/Functional-Requirements.md`; both are outdated.
   - If a field or behaviour is not in the contract, ask the user. Do not invent it, and list it under "Gaps in the
     contract" in `CLAUDE.md` if it is a real gap. Keep `delivery_addresses` vs. `delivery_address` and
     `restaurant_categories` vs. `menu_categories` separate.

4. **Write the spec files** (the layout is in the rules file)
   - `paths/<domain>.yaml`: one Path Item per URL, keyed by an internal name. All methods on a URL go in one item,
     with shared path parameters at the Path Item level.
   - `schemas/<domain>.yaml`: `PascalCase` schemas with `camelCase` properties (DB `snake_case` maps to `camelCase`).
     Never expose `password_hash`, tokens or other secrets. Use explicit response DTOs.
   - `responses/common.yaml`: add a new shared response only when a new error shape is needed.
   - `openapi.yaml`: add the URL `$ref` under `paths`, and mirror every new schema and response under
     `components`. Add a tag if the domain is new. Keep the root a `$ref` index only.
   - `docs/requirements/APIs-Endpoints.md`: add a row for every new route, in the same change.
   - Every operation needs: a `camelCase` `operationId` matching the controller action, a root-defined tag, a
     `summary`, and `examples` in `requestBody` and in each response.
   - Security: protected endpoints inherit the global `bearerAuth`. Public endpoints (browsing, register, login,
     password reset) set `security: []` explicitly.
   - Responses use the envelope schemas from `schemas/common.yaml`. Error statuses reference
     `responses/common.yaml` and are never inlined; use the status codes in the rules file.
   - List and search endpoints take `page` (default 1) and `limit` (default 20, max 100) and return
     `PaginationMeta` under `data.pagination`.

5. **Validate**
   - Run `npm run lint:api` (Redocly, config in `redocly.yaml`).
   - Fix all new errors and warnings. The localhost-server warning is already turned off in that config.

6. **Report**
   - Print a table of the endpoints added (method, path, operationId) and the endpoints skipped as already present.
   - List the files changed.
   - List any assumptions, and any gaps in the contract you ran into.

## Output Example

A new domain entry (abridged). Note the public `security: []`, `$ref`'d errors and the examples:

```yaml
# docs/api/paths/customer.yaml
loginCustomer:
  post:
    tags: [Auth]
    summary: Authenticate a customer
    operationId: loginCustomer
    security: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "../schemas/customer.yaml#/LoginRequest"
          example:
            email: sara@example.com
            password: Str0ngPass!
    responses:
      "200":
        description: Authenticated
        content:
          application/json:
            schema:
              $ref: "../schemas/customer.yaml#/LoginResponse"
            example:
              success: true
              message: Login successful
              data:
                accessToken: eyJhbGciOi...
                expiresIn: 3600
      "401":
        $ref: "../responses/common.yaml#/Unauthorized"
      "400":
        $ref: "../responses/common.yaml#/ValidationError"
```

```yaml
# docs/api/openapi.yaml (root: $ref index only)
paths:
  /auth/login/customer:
    $ref: "./paths/customer.yaml#/loginCustomer"
```

## Rules & Quality Standards

- Never overwrite or regenerate existing spec files. Merge new content only.
- Only document endpoints that follow from the contract. Never invent behaviour the contract does not support; ask.
- Output is valid OpenAPI 3.0.3 with no undefined `$ref` targets. Lint must pass before reporting done.
- `openapi.yaml` never becomes a monolith. Group by domain, not by HTTP method.
- Follow `.claude/rules/open-api-rules.md`. If this skill and the rules file disagree, the rules file wins.
- If the contract is ambiguous, ask or make the most reasonable assumption and state it in the report.
