import fs from "node:fs";
import SwaggerParser from "@apidevtools/swagger-parser";

// Turns docs/api/ into a Postman Collection v2.1 file for Apidog, with a success case and failure cases for every
// operation. OpenAPI has no place for saved requests, so an OpenAPI import gives each endpoint a single "Success"
// case. Postman saved examples do import into Apidog as endpoint cases, so each case below is one saved example on
// its operation's request:
//
// - success: the example path/query values, the `valid` body and the token of the operation's role
// - 400: every negative request-body example (missingEmail, ...), an invalid path id and an invalid query value
// - 401: no access token; 403: the token of another role; 404: an id that does not exist
// - 409, 422: depend on stored data, so they send `Prefer: code=...`, which makes the Prism mock return that response
//   (a real server ignores the header)
//
// A 400 case's expected body lists exactly the fields its request gets wrong, as the real API's validation will.
//
// Usage: npm run postman:cases [-- --only registerCustomer,loginCustomer]

const SPEC = "docs/api/openapi.yaml";
const OUT_DIR = "dist/postman";
const OUT_FILE = `${OUT_DIR}/food-delivery.postman_collection.json`;
const METHODS = ["get", "post", "put", "patch", "delete"] as const;
const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";
const STATUS_NAMES: Record<string, string> = {
  "400": "Invalid request",
  "401": "Unauthorized",
  "403": "Forbidden",
  "404": "Not found",
  "409": "Conflict with the current state",
  "422": "Invalid or expired code",
};

type Json = Record<string, unknown>;
type Actor = "customer" | "restaurant" | "driver" | "admin";

interface Header {
  key: string;
  value: string;
}

interface Parameter {
  name: string;
  in: string;
  required: boolean;
  schema: Json;
  example: unknown;
}

interface RequestParts {
  body: unknown;
  token: string | null;
  pathValues: Record<string, string>;
  queryValues: Record<string, string>;
  prefer: string | null;
}

interface Case {
  name: string;
  code: string;
  parts: RequestParts;
  expected: unknown;
}

const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, fallback: string): string => (typeof value === "string" ? value : fallback);

const onlyArg = process.argv.indexOf("--only");
const only = onlyArg === -1 ? null : new Set((process.argv[onlyArg + 1] ?? "").split(","));

const spec = (await SwaggerParser.bundle(SPEC)) as unknown as Json;

// Follows a local "#/components/..." pointer, as left by the bundle.
const resolve = (node: unknown): unknown => {
  if (!isObject(node) || typeof node["$ref"] !== "string") return node;
  let target: unknown = spec;
  for (const part of node["$ref"].replace(/^#\//, "").split("/")) {
    target = isObject(target) ? target[part.replaceAll("~1", "/").replaceAll("~0", "~")] : undefined;
  }
  return resolve(target);
};

const mediaOf = (node: unknown, type: string): Json | undefined => {
  const content = resolve(node);
  if (!isObject(content) || !isObject(content["content"])) return undefined;
  const media = content["content"][type];
  return isObject(media) ? media : undefined;
};

// "firstName" -> "First name", for error messages in the style of responses/common.yaml#/ValidationError.
const label = (field: string): string => {
  const words = field.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// The first rule a value breaks, as the real API's validation would report it, or null when the value is valid.
const fieldError = (field: string, schema: Json, value: unknown): string | null => {
  const name = label(field);
  if (value === null) return schema["nullable"] === true ? null : `${name} is required`;
  const type = schema["type"];
  if (type === "string") {
    if (typeof value !== "string") return `${name} must be text`;
    const minLength = typeof schema["minLength"] === "number" ? schema["minLength"] : 0;
    const maxLength = typeof schema["maxLength"] === "number" ? schema["maxLength"] : Infinity;
    if (value === "" && minLength > 0) return `${name} must not be empty`;
    if (value.length < minLength) return `${name} must contain at least ${minLength} characters`;
    if (value.length > maxLength) return `${name} must contain at most ${maxLength} characters`;
    if (schema["format"] === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address";
    if (schema["format"] === "uuid" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return `${name} must be a valid UUID`;
    }
    if ((schema["format"] === "date" || schema["format"] === "date-time") && Number.isNaN(Date.parse(value))) {
      return `${name} must be a valid date`;
    }
    if (typeof schema["pattern"] === "string" && !new RegExp(schema["pattern"]).test(value)) return `${name} has an invalid format`;
  }
  if (type === "integer" || type === "number") {
    if (typeof value !== "number" || (type === "integer" && !Number.isInteger(value))) return `${name} must be a number`;
    if (typeof schema["minimum"] === "number" && value < schema["minimum"]) return `${name} must be at least ${schema["minimum"]}`;
    if (typeof schema["maximum"] === "number" && value > schema["maximum"]) return `${name} must be at most ${schema["maximum"]}`;
  }
  if (type === "boolean" && typeof value !== "boolean") return `${name} must be true or false`;
  if (type === "array") {
    if (!Array.isArray(value)) return `${name} must be a list`;
    if (typeof schema["minItems"] === "number" && value.length < schema["minItems"]) {
      return `${name} must contain at least ${schema["minItems"]} items`;
    }
  }
  if (Array.isArray(schema["enum"]) && !schema["enum"].includes(value)) {
    return `${name} must be one of: ${schema["enum"].map(String).join(", ")}`;
  }
  return null;
};

// Every field a request body gets wrong against its schema: { field: message }. Empty when the body is valid.
const validationErrors = (rawSchema: unknown, body: unknown): Record<string, string> => {
  const schema = resolve(rawSchema);
  if (!isObject(schema) || !isObject(body)) return {};
  const errors: Record<string, string> = {};
  const properties = isObject(schema["properties"]) ? schema["properties"] : {};
  const required = Array.isArray(schema["required"]) ? schema["required"] : [];

  for (const field of required) {
    if (typeof field === "string" && !(field in body)) errors[field] = `${label(field)} is required`;
  }
  for (const [field, value] of Object.entries(body)) {
    const fieldSchema = resolve(properties[field]);
    if (!isObject(fieldSchema)) continue;
    const message = fieldError(field, fieldSchema, value);
    if (message) errors[field] = message;
  }
  const minProperties = typeof schema["minProperties"] === "number" ? schema["minProperties"] : 0;
  if (Object.keys(body).length < minProperties && Object.keys(errors).length === 0) {
    errors["body"] = "At least one field must be provided";
  }
  return errors;
};

const validationBody = (fields: Record<string, string>): Json => ({
  success: false,
  message: "Validation failed",
  error: { code: "VALIDATION_ERROR", fields },
});

// The response example for a status code: its `example`, or the first of its named `examples`.
const responseExample = (responses: Json, code: string): unknown => {
  const media = mediaOf(responses[code], "application/json");
  if (!media) return undefined;
  if (media["example"] !== undefined) return media["example"];
  const examples = media["examples"];
  const first = resolve(isObject(examples) ? Object.values(examples)[0] : undefined);
  return isObject(first) ? first["value"] : undefined;
};

interface PickedExample {
  key: string | null;
  summary: string | null;
  value: unknown;
}

// The named example of a response that fits the case: the first of `keys` the response has, else its first example.
// `key` goes into the Prefer header, so the Prism mock returns this example and not just the first one.
const pickExample = (responses: Json, code: string, keys: readonly string[]): PickedExample => {
  const media = mediaOf(responses[code], "application/json");
  const examples = isObject(media?.["examples"]) ? media["examples"] : {};
  const key = keys.find((candidate) => candidate in examples) ?? Object.keys(examples)[0] ?? null;
  const example = resolve(key === null ? undefined : examples[key]);
  if (!isObject(example)) return { key: null, summary: null, value: media?.["example"] };
  return { key, summary: typeof example["summary"] === "string" ? example["summary"] : null, value: example["value"] };
};

const messageOf = (body: unknown): string | null => (isObject(body) && typeof body["message"] === "string" ? body["message"] : null);

const preferFor = (code: string, picked: PickedExample): string => (picked.key ? `code=${code}, example=${picked.key}` : `code=${code}`);

// The sentence of an operation's description that explains a status, e.g. "The label must be unique within the
// restaurant (`409` otherwise)." -> "The label must be unique within the restaurant".
const reasonFor = (operation: Json, code: string): string | null => {
  const description = text(operation["description"], "").replace(/\s+/g, " ");
  const sentence = description.split(/(?<=\.)\s/).find((part) => part.includes(`\`${code}\``));
  if (!sentence) return null;
  // "(`409` if the email is taken)" names the cause directly: "The email is taken".
  const cause = new RegExp(`\\(\`${code}\` (?:if|when) ([^)]+)\\)`).exec(sentence)?.[1];
  if (cause) return cause.charAt(0).toUpperCase() + cause.slice(1);
  const reason = sentence.replace(/\s*\([^)]*`\d{3}`[^)]*\)/g, "").replace(/\.$/, "").trim();
  return reason.length > 0 && !reason.includes(`\`${code}\``) ? reason : null;
};

// Which shared Conflict example a 409 is, judged from the sentence that explains it.
const conflictKeys = (path: string, reason: string | null): string[] => {
  const why = (reason ?? "").toLowerCase();
  if (path.includes("delivery-requests")) return ["offerNoLongerAvailable"];
  if (why.includes("email")) return ["emailAlreadyExists"];
  if (/unique|taken|already|duplicate/.test(why)) return ["valueAlreadyInUse"];
  return ["invalidState"];
};

// Whose token an operation needs, read from the route conventions in CLAUDE.md. null: any logged-in user.
const actorFor = (path: string): Actor | null => {
  const auth = /^\/auth\/[^/]+\/(customer|driver|admin)$/.exec(path);
  if (auth?.[1]) return auth[1] as Actor;
  if (/^\/restaurants\/(auth|me)(\/|$)/.test(path)) return "restaurant";
  if (/^\/driver(\/|$)/.test(path)) return "driver";
  if (/^\/admin(\/|$)/.test(path)) return "admin";
  if (/^\/auth\/verify-/.test(path)) return null;
  return "customer";
};

const tokenOf = (actor: Actor): string => `{{${actor}Token}}`;

// A value that breaks a parameter's schema, or null when nothing about it can be broken.
const invalidValue = (schema: Json): unknown => {
  if (schema["format"] === "uuid") return "not-a-uuid";
  if (schema["format"] === "date" || schema["format"] === "date-time") return "not-a-date";
  if (Array.isArray(schema["enum"])) return "not_a_valid_value";
  if (typeof schema["maximum"] === "number") return schema["maximum"] + 1;
  if (typeof schema["minimum"] === "number") return schema["minimum"] - 1;
  if (schema["type"] === "integer" || schema["type"] === "number") return "abc";
  if (schema["type"] === "boolean") return "yes";
  return null;
};

// A parameter value as it travels in a URL, where everything is text.
const asParam = (value: unknown): string => (typeof value === "string" ? value : JSON.stringify(value));

const servers = spec["servers"];
const baseUrl = Array.isArray(servers) && isObject(servers[0]) ? text(servers[0]["url"], "http://localhost:3000") : "http://localhost:3000";
const rootSecurity = spec["security"];
const paths = isObject(spec["paths"]) ? spec["paths"] : {};

const folders = new Map<string, Json[]>();
const warnings: string[] = [];
let caseCount = 0;

for (const [path, rawItem] of Object.entries(paths)) {
  const pathItem = resolve(rawItem);
  if (!isObject(pathItem)) continue;

  for (const method of METHODS) {
    const operation = pathItem[method];
    if (!isObject(operation)) continue;
    const operationId = text(operation["operationId"], `${method} ${path}`);
    if (only && !only.has(operationId)) continue;

    const responses = isObject(operation["responses"]) ? operation["responses"] : {};
    const codes = Object.keys(responses);
    const successCode = codes.find((code) => code.startsWith("2")) ?? "200";

    const security = operation["security"] ?? rootSecurity;
    const isPublic = Array.isArray(security) && security.length === 0;
    const actor = actorFor(path);
    const ownToken = isPublic ? null : tokenOf(actor ?? "customer");

    const parameters: Parameter[] = [];
    const rawParameters = [
      ...(Array.isArray(pathItem["parameters"]) ? pathItem["parameters"] : []),
      ...(Array.isArray(operation["parameters"]) ? operation["parameters"] : []),
    ];
    for (const raw of rawParameters) {
      const parameter = resolve(raw);
      if (!isObject(parameter) || typeof parameter["name"] !== "string" || typeof parameter["in"] !== "string") continue;
      const schema = resolve(parameter["schema"]);
      const safeSchema = isObject(schema) ? schema : {};
      parameters.push({
        name: parameter["name"],
        in: parameter["in"],
        required: parameter["required"] === true,
        schema: safeSchema,
        example: parameter["example"] ?? safeSchema["example"],
      });
    }
    const pathParams = parameters.filter((parameter) => parameter.in === "path");
    const queryParams = parameters.filter((parameter) => parameter.in === "query");
    const hasCookie = parameters.some((parameter) => parameter.in === "cookie");

    // Request body: JSON with named examples, or multipart form fields (file uploads).
    const json = mediaOf(operation["requestBody"], "application/json");
    const multipart = mediaOf(operation["requestBody"], "multipart/form-data");
    const bodyExamples = json && isObject(json["examples"]) ? json["examples"] : {};
    const validExample = resolve(bodyExamples["valid"]);
    const validBody = isObject(validExample) ? validExample["value"] : json?.["example"];
    const hasJsonBody = json !== undefined;

    const valid: RequestParts = {
      body: validBody,
      token: ownToken,
      pathValues: Object.fromEntries(pathParams.map((parameter) => [parameter.name, asParam(parameter.example ?? UNKNOWN_ID)])),
      queryValues: Object.fromEntries(
        queryParams.filter((parameter) => parameter.required).map((parameter) => [parameter.name, asParam(parameter.example ?? "")]),
      ),
      prefer: null,
    };
    // The Prism mock answers a request that breaks the schema with 422 when the operation declares 422, so a
    // validation case there asks for the 400 explicitly.
    const validationPrefer = codes.includes("422") ? "code=400" : null;

    const cases: Case[] = [{ name: `Valid request (${successCode})`, code: successCode, parts: valid, expected: responseExample(responses, successCode) }];

    if (codes.includes("400")) {
      const before = cases.length;
      for (const [name, rawExample] of Object.entries(bodyExamples)) {
        const example = resolve(rawExample);
        if (name === "valid" || !isObject(example)) continue;
        const errors = validationErrors(json?.["schema"], example["value"]);
        if (Object.keys(errors).length === 0) warnings.push(`${operationId} · ${name}: expects 400 but the body is valid`);
        const summary = text(example["summary"], name);
        cases.push({
          name: summary,
          code: /\((\d{3})\)$/.exec(summary)?.[1] ?? "400",
          parts: { ...valid, body: example["value"], prefer: validationPrefer },
          expected: validationBody(errors),
        });
      }

      const brokenPath = pathParams.find((parameter) => invalidValue(parameter.schema) !== null);
      if (brokenPath) {
        const value = invalidValue(brokenPath.schema);
        cases.push({
          name: `\`${brokenPath.name}\` is not valid (400)`,
          code: "400",
          parts: { ...valid, pathValues: { ...valid.pathValues, [brokenPath.name]: asParam(value) }, prefer: validationPrefer },
          expected: validationBody({ [brokenPath.name]: fieldError(brokenPath.name, brokenPath.schema, value) ?? "Invalid value" }),
        });
      }

      const brokenQuery = queryParams.find((parameter) => invalidValue(parameter.schema) !== null);
      if (brokenQuery) {
        const value = invalidValue(brokenQuery.schema);
        cases.push({
          name: `\`${brokenQuery.name}\` query value is not valid (400)`,
          code: "400",
          parts: { ...valid, queryValues: { ...valid.queryValues, [brokenQuery.name]: asParam(value) }, prefer: validationPrefer },
          expected: validationBody({ [brokenQuery.name]: fieldError(brokenQuery.name, brokenQuery.schema, value) ?? "Invalid value" }),
        });
      }

      if (cases.length === before) {
        cases.push({ name: `${STATUS_NAMES["400"]} (400)`, code: "400", parts: { ...valid, prefer: "code=400" }, expected: responseExample(responses, "400") });
      }
    }

    if (codes.includes("401")) {
      if (isPublic) {
        const picked = pickExample(responses, "401", ["invalidCredentials"]);
        cases.push({
          name: `${reasonFor(operation, "401") ?? picked.summary ?? messageOf(picked.value) ?? STATUS_NAMES["401"]} (401)`,
          code: "401",
          parts: { ...valid, prefer: preferFor("401", picked) },
          expected: picked.value,
        });
      } else {
        const picked = pickExample(responses, "401", ["missingToken"]);
        cases.push({ name: "No access token (401)", code: "401", parts: { ...valid, token: null, prefer: preferFor("401", picked) }, expected: picked.value });
      }
    }

    if (codes.includes("403")) {
      const other: Actor | null = actor === null ? null : actor === "customer" ? "restaurant" : "customer";
      if (other && !isPublic) {
        const picked = pickExample(responses, "403", ["insufficientRole"]);
        cases.push({
          name: `Wrong role: ${other} token (403)`,
          code: "403",
          parts: { ...valid, token: tokenOf(other), prefer: preferFor("403", picked) },
          expected: picked.value,
        });
      } else {
        const picked = pickExample(responses, "403", ["accountSuspended"]);
        cases.push({
          name: `${picked.summary ?? STATUS_NAMES["403"]} (403)`,
          code: "403",
          parts: { ...valid, prefer: preferFor("403", picked) },
          expected: picked.value,
        });
      }
    }

    if (codes.includes("404")) {
      const target = pathParams.at(-1);
      // "addressId" -> "address", which picks deliveryAddressNotFound over the generic resourceNotFound.
      const stem = target ? target.name.replace(/Id$/, "").toLowerCase() : "";
      const examples = mediaOf(responses["404"], "application/json")?.["examples"];
      const specific = isObject(examples) && stem ? Object.keys(examples).filter((key) => key.toLowerCase().includes(stem)) : [];
      const picked = pickExample(responses, "404", [...specific, "resourceNotFound"]);
      cases.push({
        name: target ? `Unknown \`${target.name}\` (404)` : `${reasonFor(operation, "404") ?? STATUS_NAMES["404"]} (404)`,
        code: "404",
        parts: target
          ? { ...valid, pathValues: { ...valid.pathValues, [target.name]: UNKNOWN_ID }, prefer: preferFor("404", picked) }
          : { ...valid, prefer: preferFor("404", picked) },
        expected: picked.value,
      });
    }

    for (const code of codes.filter((status) => !["400", "401", "403", "404", "500"].includes(status) && !status.startsWith("2"))) {
      const reason = reasonFor(operation, code);
      const picked = pickExample(responses, code, code === "409" ? conflictKeys(path, reason) : []);
      cases.push({
        name: `${reason ?? picked.summary ?? messageOf(picked.value) ?? STATUS_NAMES[code] ?? `Status ${code}`} (${code})`,
        code,
        parts: { ...valid, prefer: preferFor(code, picked) },
        expected: picked.value,
      });
    }

    const segments = path.split("/").filter(Boolean).map((segment) => segment.replace(/^\{(.+)\}$/, ":$1"));

    const requestFor = (parts: RequestParts): Json => {
      const header: Header[] = [];
      if (hasJsonBody) header.push({ key: "Content-Type", value: "application/json" });
      if (hasCookie) header.push({ key: "Cookie", value: "refreshToken={{refreshToken}}" });
      if (parts.prefer) header.push({ key: "Prefer", value: parts.prefer });

      const query = Object.entries(parts.queryValues).map(([key, value]) => ({ key, value }));
      const queryString = query.length > 0 ? `?${query.map(({ key, value }) => `${key}=${value}`).join("&")}` : "";
      const url = {
        raw: `{{baseUrl}}/${segments.join("/")}${queryString}`,
        host: ["{{baseUrl}}"],
        path: segments,
        query,
        variable: Object.entries(parts.pathValues).map(([key, value]) => ({ key, value })),
      };
      const auth = parts.token ? { type: "bearer", bearer: [{ key: "token", value: parts.token, type: "string" }] } : { type: "noauth" };

      const request: Json = { method: method.toUpperCase(), header, auth, url };
      if (hasJsonBody) {
        request["body"] = { mode: "raw", raw: JSON.stringify(parts.body ?? {}, null, 2), options: { raw: { language: "json" } } };
      } else if (multipart) {
        const schema = resolve(multipart["schema"]);
        const properties = isObject(schema) && isObject(schema["properties"]) ? schema["properties"] : {};
        request["body"] = {
          mode: "formdata",
          formdata: Object.entries(properties).map(([key, raw]) => {
            const property = resolve(raw);
            const isFile = isObject(property) && property["format"] === "binary";
            return isFile ? { key, type: "file", src: [] } : { key, type: "text", value: isObject(property) ? asParam(property["example"] ?? "") : "" };
          }),
        };
      }
      return request;
    };

    const saved = cases.map((testCase) => ({
      name: testCase.name,
      originalRequest: requestFor(testCase.parts),
      code: Number(testCase.code),
      header: [{ key: "Content-Type", value: "application/json" }],
      body: JSON.stringify(testCase.expected ?? {}, null, 2),
      _postman_previewlanguage: "json",
    }));
    caseCount += saved.length;

    const tags = operation["tags"];
    const folder = Array.isArray(tags) && typeof tags[0] === "string" ? tags[0] : "Other";
    const item = { name: text(operation["summary"], operationId), request: requestFor(valid), response: saved };
    folders.set(folder, [...(folders.get(folder) ?? []), item]);
  }
}

const info = isObject(spec["info"]) ? spec["info"] : {};
const collection = {
  info: {
    name: text(info["title"], "API"),
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: baseUrl },
    { key: "customerToken", value: "" },
    { key: "restaurantToken", value: "" },
    { key: "driverToken", value: "" },
    { key: "adminToken", value: "" },
    { key: "refreshToken", value: "" },
  ],
  item: [...folders].map(([name, item]) => ({ name, item })),
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, `${JSON.stringify(collection, null, 2)}\n`);
const requestCount = [...folders.values()].reduce((sum, items) => sum + items.length, 0);
console.log(`Wrote ${OUT_FILE}: ${requestCount} requests, ${caseCount} cases`);
for (const warning of warnings) console.warn(`Warning: ${warning}`);
