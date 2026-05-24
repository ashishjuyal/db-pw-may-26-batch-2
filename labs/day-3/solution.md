# Lab Solution — Session 2 Playwright Core

```typescript
import { test, expect } from '@playwright/test';

test('browse Electronics, view product detail, and trigger login redirect', async ({ page }) => {

  // ── 1. Navigate to the Products page (not logged in) ──────────────────────
  await page.goto('/products');
  await expect(page.getByTestId('products-heading')).toBeVisible();

  // ── 2. Filter by Electronics ───────────────────────────────────────────────
  await page.getByTestId('filter-electronics').click();

  // Wait for the async fetch to complete — spinner appears then disappears
  await expect(page.getByTestId('loading-spinner')).toBeVisible();
  await expect(page.getByTestId('loading-spinner')).not.toBeVisible();

  // Every visible category label should be "Electronics"
  const categoryLabels = page.getByTestId('product-category');
  const count = await categoryLabels.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(categoryLabels.nth(i)).toHaveText('Electronics');
  }

  // ── 3. Click through to a product detail page ─────────────────────────────
  await page.getByTestId('product-link').first().click();

  // Assert name, price, and stock badge are all visible
  await expect(page.getByTestId('product-detail-name')).toBeVisible();
  await expect(page.getByTestId('product-detail-price')).toBeVisible();
  // At least one stock badge is present (in-stock or low-stock; product 4 has stock=15)
  const stockInfo = page.getByTestId('stock-info');
  await expect(stockInfo).toBeVisible();

  // ── 4. Click Add to cart — redirects to login (not authenticated) ─────────
  await page.getByTestId('add-to-cart-btn').click();
  await expect(page).toHaveURL(/\/login/);

  // ── 5. Log in with standard user credentials ──────────────────────────────
  await page.getByTestId('login-email').fill('standard_user@example.com');
  await page.getByTestId('login-password').fill('Password123!');
  await page.getByTestId('login-submit').click();

  // ── 6. Verify redirect back — ends up on products, not the login page ─────
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByTestId('nav-logout')).toBeVisible();
});
```

### Key decisions explained

- **Waiting for the spinner** — the category filter triggers an async fetch with a 400 ms delay. Asserting `toBeVisible()` then `not.toBeVisible()` on the spinner is the correct pattern; it avoids a hard wait and confirms the fetch both started and completed.
- **`for` loop over category labels** — Playwright's `count()` + `nth()` lets you assert on every element in a matched set. For small sets this is fine; for large sets consider `locator.all()` with `Promise.all`.
- **Redirect after unauthenticated cart click** — the client-side JS reads `data-require-auth` and calls `window.location.href = '/login?next=/products'`. Asserting `/\/login/` confirms the redirect happened.
- **Post-login assertion** — checking `nav-logout` is visible (rather than just the URL) confirms the session was established, not just that navigation occurred.

---

> Back to the [lab](README.md).
