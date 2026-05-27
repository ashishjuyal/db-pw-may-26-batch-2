import { test, expect, APIRequestContext, Page } from "@playwright/test";
import { request } from "node:http";

async function setAuth(request: APIRequestContext, page: Page) {
  const response = await request.post("/api/auth/login", {
    data: { email: "standard_user@example.com", password: "Password123!" },
  });
  expect(response.status()).toBe(200);
  const { token } = await response.json();

  await page
    .context()
    .addCookies([
      { name: "token", value: token, domain: "localhost", path: "/" },
    ]);
}


test("Exercise 1: GET /api/products returns the product catalogue", async ({
  request,
}) => {
  const response = await request.get("/api/products");

  expect(response.status()).toBe(200);

  const body = await response.json();

  const electronics = body.products.filter(
    (p: { category: string }) => p.category === "Electronics",
  );
  // console.log("One: ", body.products.find((p: { category: string }) => p.category === "Electronics"));

  // console.log(electronics);
  expect(body).toHaveProperty("products");
  expect(body).toHaveProperty("count");

  expect(electronics.length).toBe(4);
  expect(body.products.length).toBe(12);
  expect(body.count).toBe(12);
});

test("Exercise 2: product name in the API matches the UI", async ({
  page,
  request,
}) => {
  const response = await request.get("/api/products/1");
  expect(response.status()).toBe(200);
  const { product } = await response.json();

  await page.goto(`/products/1`);

  await expect(page.getByTestId("product-detail-name")).toHaveText(
    product.name,
  );
  await expect(page.getByTestId("product-detail-price")).toHaveText(
    `$${product.price.toFixed(2)}`,
  );
});

test.describe('Exercise 3 container', () => {
  // pre-condition
  test.beforeEach(async ({request, page}) => await setAuth(request, page));

  test("Exercise 3: access authenticated pages by injecting a session cookie", async ({ page, request }) => {  
    await page.goto("/orders");
    await expect(page.getByTestId("orders-heading")).toBeVisible();
    await expect(page.getByTestId("nav-logout")).toBeVisible();
  });
})


test.describe("Exercise 4 scenario", () => {
  let productName: string;
  let product: { id: number };
  let adminToken: string;

  test.beforeEach(async ({request, page}) => {
    const loginRes = await request.post("/api/auth/login", {
      data: { email: "admin@example.com", password: "Admin123!" },
    });
    expect(loginRes.status()).toBe(200);
    const { token } = await loginRes.json();
    adminToken = token;

      // Create a unique product
    productName = `Lab-Product-${Date.now()}`;
    const createRes = await request.post("/api/products", {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { name: productName, description: "Created by test", price: 42.99, category: "Electronics", stock: 5, },
    });

    expect(createRes.status()).toBe(201);
    const body = await createRes.json();
    product = body.product;

    await setAuth(request, page);
  });

  test.afterEach(async ({request}) => {
    // Clean up
    await request.delete(`/api/products/${product.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });

  test('Exercise 4: API-created product appears in the UI', async ({ page, request }) => {
    // Verify in UI
    await page.goto("/products");
    await page.getByTestId("search-input").fill(productName);
    await page.getByTestId("search-btn").click();
    await expect(page.getByTestId("loading-spinner")).not.toBeVisible();
    await expect(page.getByTestId("product-card")).toHaveCount(1);
    await expect(page.getByTestId("product-name")).toHaveText(productName);    
  });

});



