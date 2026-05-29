import { test, expect } from "@playwright/test";

test("login, search for a product, and logout", async ({ page }) => {
  // ── Step 1: Open the home page ────────────────────────────────────────────
  // Navigate to '/'
  await page.goto('/');

  const navLogin = page.getByTestId('nav-login');
  // Prove you are NOT logged in: the login nav link should be visible
  await expect(navLogin).toBeVisible();
  // ── Step 2: Go to the login page and log in ───────────────────────────────
  // Click the login link in the nav
  await navLogin.click();
  const initialUrl = page.url();
  // Fill in email: standard_user@example.com  
  // Fill in password: Password123!
  await page.getByTestId("login-email").fill("standard_user@example.com");
  await page.getByTestId("login-password").fill("Password123!");
  // Submit the form
  await page.getByTestId('login-submit').click(); 
  // Prove the URL changed to contain /login before the redirect
  await expect(page).not.toHaveURL(initialUrl);

  // ── Step 3: Confirm login succeeded ──────────────────────────────────────
  // Prove the logout nav link is now visible
  await expect(page.getByTestId('nav-logout')).toBeVisible();

  // Prove the nav shows the user's first name ("Alex")
  await expect(page.getByTestId('nav-username')).toHaveText('Alex');

  // ── Step 4: Search for a product ─────────────────────────────────────────
  // Navigate to the products page using the nav link
  await page.getByRole('link', {name: 'Products', exact: true}).click();
  
  
  // Type "Keyboard" into the search input 
  await page.getByTestId("search-input").fill("Keyboard");
  // Trigger the search
  
  // Wait for the results to load (there is an async fetch — how do you know when it's done?)
  const loader = page.getByTestId("loading-spinner");
  await loader.waitFor({ state: "visible" });
  await loader.waitFor({ state: "hidden" });

  // await expect(loader).toBeVisible();
  // await expect(loader).not.toBeVisible();

  // Prove exactly 1 product card is visible
  await expect(page.getByTestId('product-card')).toHaveCount(2);

  // ── Step 5: Verify the result ─────────────────────────────────────────────
  // Prove the product name is "Mechanical Keyboard"
  await expect(page.getByTestId("product-name")).toHaveText( "Mechanical Keyboard" );
  // ── Step 6: Log out ───────────────────────────────────────────────────────
  // Click the logout nav link
  await page.getByTestId('nav-logout').click();

  // Prove the login nav link is visible again
  await expect(page.getByTestId("nav-login")).toBeVisible();
  // Prove the URL is back to '/'
  await expect(page).toHaveURL('/');
});
