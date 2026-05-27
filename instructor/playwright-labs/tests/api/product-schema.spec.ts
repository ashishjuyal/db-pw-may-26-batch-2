import { test, expect } from "@playwright/test";
import Ajv from "ajv";

const ajv = new Ajv();

const productSchema = {
  type: "object",
  required: ["id", "name", "price", "category", "stock"],
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    description: { type: "string" },
    price: { type: "number", minimum: 0 },
    category: {
      type: "string",
      enum: ["Electronics", "Accessories", "Software"],
    },
    stock: { type: "integer", minimum: 0 },
    image_url: { type: "string" },
    created_at: { type: "string" },
  },
  additionalProperties: false,
};

const responseSchema = {
  type: "object",
  required: ["products", "count"],
  properties: {
    products: {
      type: "array",
      items: productSchema,
    },
    count: { type: "integer", minimum: 0 },
  },
  additionalProperties: false,
};

test("GET /api/products response matches schema", async ({ request }) => {
  const response = await request.get("/api/products");
  expect(response.status()).toBe(200);

  const body = await response.json();

  const validate = ajv.compile(responseSchema);
  const valid = validate(body);

  if (!valid) {
    console.error("Schema validation errors:", validate.errors);
  }
  expect(valid, `Schema errors: ${JSON.stringify(validate.errors)}`).toBe(true);
});

test("GET /api/products/:id response matches schema", async ({ request }) => {
  const singleProductSchema = {
    type: "object",
    required: ["product"],
    properties: {
      product: productSchema,
    },
    additionalProperties: false,
  };

  const response = await request.get("/api/products/1");
  expect(response.status()).toBe(200);

  const body = await response.json();
  const validate = ajv.compile(singleProductSchema);
  const valid = validate(body);

  if (!valid) console.error("Schema errors:", validate.errors);
  expect(valid).toBe(true);
});
