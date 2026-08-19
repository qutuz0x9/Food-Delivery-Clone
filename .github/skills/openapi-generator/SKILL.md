---
name: openapi-generator
description: Read a markdown file containing a list of APIs and generate complete API documentation in OpenAPI Specification 3.0 (YAML or JSON). Use when the user wants to generate or scaffold OpenAPI docs from a markdown API list.
user-invocable: true
---

# OpenAPI Generator Skill

Read a markdown file that describes a list of API endpoints and produce a fully-structured **OpenAPI Specification 3.0** document (YAML by default, JSON on request).

## Usage

```
/openapi-generator
/openapi-generator <path-to-markdown-file>
/openapi-generator <path-to-markdown-file> --format json
```

## Behavior

1. **Locate the markdown file**
   - If a path is provided, use it directly.
   - Otherwise, look for common candidates in this order: `API.md`, `APIS.md`, `docs/api.md`, `docs/APIs.md`, `README.md`.
   - If none found, ask the user to provide the path.

2. **Parse the markdown**
   - Extract every API endpoint entry. Look for:
     - HTTP method + path (e.g., `GET /users`, `POST /orders/{id}`)
     - Description / summary text near each endpoint
     - Request parameters (path, query, header, cookie) listed in the markdown
     - Request body fields and their types
     - Response status codes and their meanings
     - Authentication / authorization notes
     - Any example payloads embedded as code blocks
   - If the markdown uses a table, list, or heading-based structure, adapt the parser to each style.

3. **Infer missing details intelligently**
   - Derive sensible `operationId` values from the method + path (e.g., `GET /users/{id}` → `getUserById`).
   - Infer common request/response schemas from field names and context (e.g., `email` → `string, format: email`; `createdAt` → `string, format: date-time`).
   - Add standard error responses (`400`, `401`, `403`, `404`, `422`, `500`) where appropriate.
   - Use `bearerAuth` (JWT) as the default security scheme when auth is mentioned without specifics.

4. **Generate the OpenAPI 3.0 document**
   - Output format: **YAML** unless `--format json` is passed.
   - Output file: `docs/openapi.yaml` (or `docs/openapi.json`). Create the `docs/` directory if it does not exist.
   - Structure:
     ```
     openapi: "3.0.3"
     info:        — title, version, description derived from the project
     servers:     — at least one entry; infer from README or use a placeholder
     tags:        — group endpoints by resource (e.g., Auth, Users, Orders)
     paths:       — every endpoint with full operation object
     components:
       schemas:   — reusable request/response schemas
       securitySchemes: — if auth is mentioned
     ```

5. **Report output**
   - Print a summary table of the generated endpoints (method, path, operationId).
   - State the output file path.
   - Note any endpoints where information was incomplete and assumptions were made.

## Markdown File Format — Supported Styles

The skill handles several common layouts. Examples:

### Heading-based
```markdown
## POST /auth/login
Authenticate a user and return a JWT access token.

**Request body:** `email` (string), `password` (string)
**Response 200:** `{ token: string, expiresIn: number }`
**Response 401:** Invalid credentials
```

### Table-based
```markdown
| Method | Path            | Description                  |
|--------|-----------------|------------------------------|
| GET    | /users          | List all users               |
| POST   | /users          | Create a new user            |
| GET    | /users/{id}     | Get a user by ID             |
| DELETE | /users/{id}     | Delete a user                |
```

### List-based
```markdown
- `GET /products` — List products with optional filters
- `POST /products` — Create a product (admin only)
- `GET /products/{id}` — Get product details
```

## Output Example (YAML snippet)

```yaml
openapi: "3.0.3"
info:
  title: Food Delivery API
  version: "1.0.0"
  description: Auto-generated from API.md
servers:
  - url: http://localhost:3000/api/v1
    description: Local development server
tags:
  - name: Auth
    description: Authentication endpoints
paths:
  /auth/login:
    post:
      tags: [Auth]
      summary: Authenticate a user and return a JWT access token
      operationId: loginUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        "200":
          description: Successful authentication
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        "401":
          description: Invalid credentials
components:
  schemas:
    LoginRequest:
      type: object
      required: [email, password]
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          format: password
    AuthResponse:
      type: object
      properties:
        token:
          type: string
        expiresIn:
          type: integer
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## Rules & Quality Standards

- Always produce **valid OpenAPI 3.0.3** — no undefined `$ref` targets, no missing required fields.
- Reuse schemas via `$ref` under `components/schemas` rather than inlining repetitive objects.
- Use `snake_case` for schema property names and `camelCase` for `operationId`.
- Group endpoints under meaningful `tags` derived from the URL resource segment.
- Never invent endpoints that are not present in the markdown — only infer details for endpoints that are explicitly listed.
- If the markdown is ambiguous, make the most reasonable assumption and note it in the output summary.
