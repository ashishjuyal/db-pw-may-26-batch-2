import { test, expect } from "@playwright/test";

const mockProducts = [
  {
    id: 999,
    name: "Mock Widget",
    description: "Test item",
    price: 9.99,
    category: "Electronics",
    stock: 5,
    image_url: "/images/headphones.svg",
  },
  {
    id: 998,
    name: "Mock Gadget",
    description: "Test item 2",
    price: 49.99,
    category: "Accessories",
    stock: 10,
    image_url: "/images/placeholder.svg",
  },
];

test("mock products appear in the UI", async ({ page }) => {
  // **/api/products* catches the empty query string (?...) that URLSearchParams appends


  await page.route("**/api/products*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        products: mockProducts,
        count: mockProducts.length,
      }),
    });
  });

  await page.goto("/products");

  // Click Search to trigger the client-side fetch — the route intercepts it
  await page.getByTestId("search-btn").click();
  await expect(page.getByTestId("loading-spinner")).not.toBeVisible();

  await expect(page.getByTestId("product-card")).toHaveCount(2);
  await expect(page.getByTestId("product-name").nth(0)).toHaveText(
    "Mock Widget",
  );
  await expect(page.getByTestId("product-name").nth(1)).toHaveText(
    "Mock Gadget",
  );

  await page.waitForTimeout(4000);
});
