import { expect, test, Page } from "@playwright/test";

test("Exercise 0: function definition", myTestFunction);

async function myTestFunction({ page }: { page: Page }) {
  //                        └───┬──┘   └─────┬──────┘
  //                            │            │
  //                 1. UNPACKS the page     2. VALIDATES that the unpacked
  //                    variable so you         variable matches the Playwright
  //                    can use it directly     "Page" data type.
}


test("Exercise 1: home page loads correctly", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("TestMart");
  await expect(page.getByTestId("nav-logo")).toBeVisible();

  await expect(page.getByTestId("nav-logo")).toHaveText("TestMart");

  await expect(page.getByTestId("hero-title")).toBeVisible();
  await expect(page.getByTestId("hero-title")).toHaveText(
    "Quality tools for quality engineers",
  );
});

test("Exercise 2: find buttons and links by role", async ({ page }) => {
  await page.goto("/");

  // The "Browse Products" CTA is a link rendered as a button
  const ctaLink = page.getByRole("link", { name: "Browse Products" });
  await expect(ctaLink).toBeVisible();

  // The nav "Log in" is also a link
  const loginLink = page.getByTestId("nav-login");
  
  await expect(loginLink).toBeVisible();

  // The nav "Products" link
  await expect(page.getByRole("link", { name: "Products", exact: true })).toBeVisible();
});

test("Exercise 3: count product cards", async ({ page }) => {
  // Home page shows exactly 4 featured products
  await page.goto("/");
  await expect(page.getByTestId("product-card")).toHaveCount(4);

  // Products page shows all 12
  await page.goto("/products");
  await expect(page.getByTestId("product-card")).toHaveCount(12); //total products

  await expect(page.getByTestId('product-card').filter({hasText: "Software"})).toHaveCount(4);
});
