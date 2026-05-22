# Session 3 — Stability & Assertions

> **Lab 2: Stabilise and Refactor Session 2 Scripts**
> Master assertion patterns through deliberate failure.

---

## Lab at a Glance

```
Part A        → 5 assertion exercises — one concept each
  Exercise 1  → toHaveText vs toBeVisible — when toBeVisible() is not enough
  Exercise 2  → Soft assertions — collect all failures
  Exercise 3  → Toast: assert appears then disappears
  Exercise 4  → beforeEach hook — extract repeated navigation
  Exercise 5  → Replace waitForTimeout with a condition assertion
```

> **TestMart** must be running: `cd testmart && npm start`

---

## Prerequisites

- Session 2 lab completed — `tests/login-flow.spec.ts` exists and passes
- TestMart running on `http://localhost:3000`

---

## Part A — Assertion Exercises

Add each exercise to `tests/testmart.spec.ts` alongside your Session 2 exercises.

---

### Exercise 1 — toHaveText vs toBeVisible

Write a test that verifies a user is logged in after submitting the login form:

```typescript
test('Exercise 1: verify login state', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill('standard_user@example.com');
  await page.getByTestId('login-password').fill('Password123!');
  await page.getByTestId('login-submit').click();

  // Assert that the username element is visible in the nav
  await expect(page.getByTestId('nav-username')).toBeVisible();
});
```

Run it — the test passes.

📋 Now consider: if your application had a bug where `admin@example.com` was accidentally logged in instead of `standard_user@example.com`, would this test catch it? Why or why not — and how would you rewrite the assertion so it would?

<details>
  <summary>Need some help?</summary>

  `toBeVisible()` only confirms the element is present — it does not check what it says. If the admin user was shown instead of Alex, `nav-username` would still be visible and the test would still pass. That is a false positive — a test that passes even when the feature is broken.

  Replace the assertion with `toHaveText()` to verify the correct user is shown:

  ```typescript
  await expect(page.getByTestId('nav-username')).toHaveText('Alex');
  ```

  Now if any other user is logged in, the test fails with a clear message showing who was expected and who was actually shown. `toHaveText` confirms both presence and correctness in one assertion.

</details>

---

### Exercise 2 — Soft Assertions: Collect All Failures at Once

Navigate to the products page and write three assertions against the first product card — checking its category, name, and price. Look at the TestMart products page in your browser to read the actual values, then write them:

```typescript
test('Exercise 2: soft assertions on a product card', async ({ page }) => {
  await page.goto('/products');

  const firstCard = page.getByTestId('product-card').first();

  await expect.soft(firstCard.getByTestId('product-category')).toHaveText('???'); // fill in
  await expect.soft(firstCard.getByTestId('product-name')).toHaveText('???');     // fill in
  await expect.soft(firstCard.getByTestId('product-price')).toHaveText('???');    // fill in
});
```

Fill in the actual values, run the test, and check whether all three pass:

```bash
npx playwright test --headed
```

📋 Now change one of the three assertions to a value you know is wrong and run again. How many assertions execute before the test stops? Then replace `expect.soft` with regular `expect` on just the first assertion and run once more — what changes?

<details>
  <summary>Need some help?</summary>

  With `expect.soft`, all three assertions always run regardless of failures. The test is marked failed at the end but you see every failure in a single report — useful when checking multiple independent fields on the same component.

  With regular `expect`, execution stops at the first failure. Assertions 2 and 3 never run — you fix one problem, re-run, and discover the next. For a component with 5 fields, that means 5 separate runs to find all issues.

  Use `expect.soft` when assertions are independent of each other (checking a product card's attributes). Use regular `expect` when a later step depends on an earlier one passing (you must be logged in before you can search).

</details>

---

### Exercise 3 — Toast: Assert Appears Then Disappears

Add a product to the cart after logging in. The toast notification appears briefly and then auto-dismisses. Write assertions for both states.

First, log in using the credentials from Session 2. Then add this test:

```typescript
test('Exercise 3: toast appears and dismisses after add to cart', async ({ page }) => {
  // Navigate to products (you need to be logged in — add login steps here)

  // Click the first in-stock Add to Cart button
  await page.getByTestId('add-to-cart-btn').first().click();

  // Write the two toast assertions here:
  // 1. The toast should be visible immediately after clicking
  // 2. The toast should NOT be visible after it auto-dismisses (within 3 seconds)
});
```

📋 Write the two assertions. What is the risk of only writing the second assertion (not visible) without the first (visible)?

<details>
  <summary>Need some help?</summary>

  ```typescript
  await expect(page.getByTestId('toast')).toBeVisible();
  await expect(page.getByTestId('toast')).not.toBeVisible();
  ```

  If you only assert `not.toBeVisible()`, the assertion could pass before the toast even appears — the element is not visible because the action hasn't completed yet. Asserting `toBeVisible()` first proves the toast actually appeared. Both together prove the full lifecycle: appeared and then dismissed.

</details>

---

### Exercise 4 — beforeEach Hook: Eliminate Navigation Duplication

You have two tests that both start by navigating to `/products`. Extract the navigation into a `beforeEach`.

Write this in a new file `tests/hooks.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

// Both tests currently navigate to /products separately

test('search for Keyboard', async ({ page }) => {
  await page.goto('/products');    // ← duplicated
  await page.getByTestId('search-input').fill('Keyboard');
  await page.getByTestId('search-btn').click();
  await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
  await expect(page.getByTestId('product-card')).toHaveCount(1);
});

test('filter by Electronics', async ({ page }) => {
  await page.goto('/products');    // ← duplicated
  await page.getByTestId('filter-electronics').click();
  await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
  await expect(page.getByTestId('product-card')).toHaveCount(4);
});
```

📋 Refactor these two tests to use `test.describe` with a `beforeEach` that handles the navigation. Both tests must still pass after the refactor.

<details>
  <summary>Need some help?</summary>

  ```typescript
  test.describe('Products page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/products');
    });

    test('search for Keyboard', async ({ page }) => {
      await page.getByTestId('search-input').fill('Keyboard');
      await page.getByTestId('search-btn').click();
      await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
      await expect(page.getByTestId('product-card')).toHaveCount(1);
    });

    test('filter by Electronics', async ({ page }) => {
      await page.getByTestId('filter-electronics').click();
      await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
      await expect(page.getByTestId('product-card')).toHaveCount(4);
    });
  });
  ```

  Each test now starts on `/products` without repeating the navigation. If the URL changes, you fix it in one place.

</details>

---

### Exercise 5 — Replace waitForTimeout with a Condition Assertion

This test uses a `waitForTimeout` and is flaky — it sometimes fails on slow machines:

```typescript
test('Exercise 5: flaky search (fix me)', async ({ page }) => {
  await page.goto('/products');
  await page.getByTestId('search-input').fill('SSD');
  await page.getByTestId('search-btn').click();

  await page.waitForTimeout(1000); // ← arbitrary wait — replace this

  await expect(page.getByTestId('product-card')).toHaveCount(1);
});
```

📋 Replace `waitForTimeout` with a condition assertion that proves the fetch has completed before you count the results. What is the visible signal that tells you the search has finished?

<details>
  <summary>Need some help?</summary>

  The TestMart search shows a loading spinner while fetching. Asserting the spinner's lifecycle is the correct replacement:

  ```typescript
  await page.getByTestId('search-btn').click();
  await expect(page.getByTestId('loading-spinner')).toBeVisible();
  await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
  await expect(page.getByTestId('product-card')).toHaveCount(1);
  ```

  The spinner appearing confirms the fetch started. The spinner disappearing confirms it finished. `toHaveCount` now runs against a fully-loaded result set rather than hoping 1 second was enough.

</details>

---

## Part A — Checkpoint

```bash
npx playwright test
```

---


*Proceed to **Session 4 — Page Object Model & Hybrid Testing: Playwright Across Layers** once all acceptance criteria are met.*
