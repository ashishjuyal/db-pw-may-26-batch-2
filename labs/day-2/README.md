# Session 2 — Playwright Core: Setup, Locators & First Tests

> **Lab 1: From First Test to First Journey**
> Set up Playwright, explore its locator strategies through focused exercises on TestMart, then put it all together in a complete Login → Search → Logout flow.

---

## Lab at a Glance

```
Setup         → Install Playwright and point it at TestMart
Part A        → 6 locator exercises — one concept each, no full flows
  Exercise 1  → Assert page elements (role, testid, title)
  Exercise 2  → Find buttons and links by role
  Exercise 3  → Count elements on a page
  Exercise 4  → Nested locators and text assertions
  Exercise 5  → Three ways to find the same input
  Exercise 6  → Assert what is NOT visible
Part B        → First full journey: Login → Search → Logout
Report        → Run, fail deliberately, read the HTML report
```

> **TestMart** must be running before you start. In a separate terminal: `cd testmart && npm start`

---

## Prerequisites

- Node.js 20+ installed: `node -v`
- TestMart running on `http://localhost:3000`
- VS Code open in your working directory

---

## Setup — Install Playwright and Configure TestMart (10 min)

Create a project directory and run the interactive Playwright setup:

```bash
mkdir playwright-labs && cd playwright-labs
npm init playwright@latest
```

When prompted:

| Prompt | Answer |
|--------|--------|
| TypeScript or JavaScript? | **TypeScript** |
| Where to put tests? | `tests` |
| Add a GitHub Actions workflow? | **No** |
| Install Playwright browsers? | **No** |

Once complete, open `playwright.config.ts` and update `baseURL` to point at TestMart:

```typescript
use: {
  baseURL: 'http://localhost:3000',
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
},
```

Delete the generated example files — you will write everything from scratch:

```bash
rm tests/example.spec.ts
```

Create your first spec file:

```bash
touch tests/testmart.spec.ts
```

### Verify

```bash
npx playwright test
```

You should see: `0 tests` (no tests yet, no errors). TestMart should be responding at `http://localhost:3000`.

> **UI Mode — run tests visually instead of from the terminal:**
> ```bash
> npx playwright test --ui
> ```
> A browser window opens with a full graphical test runner. You can click individual tests to run them, watch tests re-run automatically every time you save a file, and step through each action with a screenshot timeline (time-travel debugging). Most participants find UI Mode faster during the exercises below — run a test, see it fail, fix it, watch it re-run instantly. Use whichever you prefer; all exercises in this lab work with both.

---

## Anatomy of a Playwright Test

Before writing any exercises, read through this annotated test. Every test you write in this lab uses exactly this structure — understanding it once means you never have to think about it again.

```typescript
// ── (1) Import ────────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';
//       ^^^^  ^^^^^^
//       |     └─ the assertion library — provides toBeVisible(), toHaveText(), etc.
//       └─ the test function — defines a single test case

// ── (2) Test definition ───────────────────────────────────────────────────────
test('home page loads correctly', async ({ page }) => {
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^   ^^^^
  //   |                            |       └─ fixture: Playwright creates a fresh
  //   |                            |          browser tab and injects it here
  //   |                            └─ async: required because every browser
  //   |                               interaction is asynchronous
  //   └─ test name: appears in the HTML report and terminal output

  // ── (3) Navigation ──────────────────────────────────────────────────────────
  await page.goto('/');
  //    ^^^^^ ─ always await browser calls — without it, Playwright moves
  //             to the next line before the browser has done anything
  //    page.goto('/') ─ navigates to baseURL + '/' = http://localhost:3000/

  // ── (4) Assertion ────────────────────────────────────────────────────────────
  await expect(page.getByTestId('nav-logo')).toBeVisible();
  //           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ───────────
  //           |                                └─ assertion: keeps retrying
  //           |                                   for up to 5 seconds before
  //           |                                   failing
  //           └─ locator: describes WHICH element to find
});
```

**The five things to remember:**

| Part | What it does |
|------|-------------|
| `import { test, expect }` | Pulls in the test runner and assertion library |
| `test('name', async ({ page }) => {` | Defines one test — name shows in the report |
| `{ page }` | A fresh browser tab, created and destroyed per test |
| `await` | Pauses until the browser finishes — never skip it |
| `expect(...).toBeVisible()` | Assertion — auto-retries until passing or timeout |

**Running tests — four modes:**
```bash
npx playwright test tests/testmart.spec.ts          # headless (fastest, CI default)
npx playwright test tests/testmart.spec.ts --headed # visible browser window
npx playwright test tests/testmart.spec.ts --debug  # step through with Inspector
npx playwright test --ui                            # UI Mode — graphical runner with watch mode
```

**UI Mode benefits over the terminal:**
- Click any test in the tree to run just that one — no `--grep` needed
- Watch mode: the test re-runs automatically every time you save the file
- Time-travel: click any step in the timeline to see a screenshot of the page at that exact moment
- Filter by file, test name, or tag without memorising flags

---

## Part A — Locator Playground

Six short, focused exercises. Each one teaches a single concept. Work through them in order — each builds on the last.

Create the following scaffold in `tests/testmart.spec.ts` and add each exercise inside it:

```typescript
import { test, expect } from '@playwright/test';

// Exercises go here
```

---

### Exercise 1 — Is TestMart Home?

Navigate to the home page and assert three things are true without clicking anything.

```typescript
test('Exercise 1: home page loads correctly', async ({ page }) => {
  await page.goto('/');

  // Assert 1: the browser tab title contains "TestMart"
  await expect(page).toHaveTitle(/TestMart/);

  // Assert 2: the nav logo text is visible
  await expect(page.getByTestId('nav-logo')).toBeVisible();

  // Assert 3: the hero heading is present
  await expect(page.getByTestId('hero-title')).toBeVisible();
});
```

Run it:

```bash
npx playwright test --headed
```

📋 The hero title says "Quality tools for quality engineers." How would you assert its **exact text** rather than just its visibility?

<details>
  <summary>Need some help?</summary>

  Use `toHaveText()` instead of `toBeVisible()`:

  ```typescript
  await expect(page.getByTestId('hero-title'))
    .toHaveText('Quality tools for quality engineers');
  ```

  `toHaveText` auto-retries until the text matches or the timeout expires — same retry behaviour as `toBeVisible`.

</details>

---

### Exercise 2 — Finding Buttons and Links by Role

ARIA roles are the most resilient locator strategy. Add this test:

```typescript
test('Exercise 2: find buttons and links by role', async ({ page }) => {
  await page.goto('/');

  // The "Browse Products" CTA is a link rendered as a button
  const ctaLink = page.getByRole('link', { name: 'Browse Products' });
  await expect(ctaLink).toBeVisible();

  // The nav "Log in" is also a link
  const loginLink = page.getByTestId('nav-login');
  await expect(loginLink).toBeVisible();

  // The nav "Products" link
  await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
});
```

Run it:

```bash
npx playwright test --headed
```

📋 What is the difference between `getByRole('button', ...)` and `getByRole('link', ...)`? Open DevTools on the home page and look at the HTML for the "Browse Products" element — is it a `<button>` or an `<a>`?

<details>
  <summary>Need some help?</summary>

  A `<button>` element has the implicit ARIA role `button`. An `<a>` element has the implicit ARIA role `link`. Playwright maps these automatically — you don't need to add any ARIA attributes to the HTML.

  On TestMart's home page, "Browse Products" is an `<a href="/products">` element, so `getByRole('link', { name: 'Browse Products' })` is the correct strategy. Using the wrong role would cause a `TimeoutError` — the locator would never match.

</details>

📋 The last assertion failed. Read the error message carefully. How many elements matched `getByRole('link', { name: 'Products' })`? Scroll the home page and count every visible link whose text contains the word "Products" — why did Playwright match more than one?

<details>
  <summary>Need some help?</summary>

  By default, Playwright matches the `name` option **as a substring** (partial, case-insensitive). On the TestMart home page, three links all contain the word "Products":

  - **"Products"** — nav link
  - **"Browse Products"** — hero CTA button
  - **"View all products"** — footer link in the featured section

  Because all three match, Playwright throws a strict mode violation:

  ```
  Error: strict mode violation:
  getByRole('link', { name: 'Products' }) resolved to 3 elements.
  ```

  Strict mode means: if a locator matches more than one element, any action on it fails immediately — Playwright refuses to guess which one you meant.

</details>

📋 Now fix the locator so it matches only the nav link. The nav link's full text is exactly "Products" — nothing more, nothing less. How would you tell Playwright to match the full string rather than a substring?

<details>
  <summary>Need some help?</summary>

  Add `exact: true` to the options object:

  ```typescript
  // Before — partial match, 3 elements match, strict mode violation
  page.getByRole('link', { name: 'Products' })

  // After — exact match, only the nav link matches
  page.getByRole('link', { name: 'Products', exact: true })
  ```

  `exact: true` switches matching from "contains this string" to "equals this string exactly". Update the failing line and re-run — the test should pass.

  **Rule to remember:** use `exact: true` whenever the name you're matching is a substring of other visible text on the page. You will hit the same problem in Exercise 4 with elements that repeat in a product grid.

</details>

---

### Exercise 3 — Counting Elements

```typescript
test('Exercise 3: count product cards', async ({ page }) => {
  // Home page shows exactly 4 featured products
  await page.goto('/');
  await expect(page.getByTestId('product-card')).toHaveCount(4);

  // Products page shows all 12
  await page.goto('/products');
  await expect(page.getByTestId('product-card')).toHaveCount(12);
});
```

📋 Run the test — does it pass? Now change `12` to `10` and run again. Read the error message carefully. What does Playwright tell you about what it actually found vs what you expected?

<details>
  <summary>Need some help?</summary>

  `toHaveCount` auto-retries — Playwright keeps checking the count until it matches or times out. When it fails, the error message reads:

  ```
  Expected: 10
  Received: 12
  ```

  This is the pattern to use whenever you need to assert on a dynamically loaded list — after a search, a filter, or any async operation that adds or removes items.

</details>

---

### Exercise 4 — Nested Locators and Text Assertions

Sometimes you need to find an element *inside* another element. On the products page each card contains a name, price, and button — but all cards are siblings. Using a nested locator scopes your search to one card.

```typescript
test('Exercise 4: read content inside the first product card', async ({ page }) => {
  await page.goto('/products');

  // Scope to the first product card only
  const firstCard = page.getByTestId('product-card').first();

  // Assert the name and price inside that card are visible
  await expect(firstCard.getByTestId('product-name')).toBeVisible();
  await expect(firstCard.getByTestId('product-price')).toBeVisible();

  // The price always starts with a dollar sign
  const priceText = await firstCard.getByTestId('product-price').textContent();
  expect(priceText).toMatch(/^\$/);

  // The Add to Cart button is inside this card
  await expect(firstCard.getByTestId('add-to-cart-btn')).toBeVisible();
});
```

📋 What happens if you remove `.first()` from `page.getByTestId('product-card')` and call `.getByTestId('product-name')` directly on it? Try it and read the error.

<details>
  <summary>Need some help?</summary>

  Without `.first()`, the locator matches all 12 product cards. When you then call `.getByTestId('product-name')` on a locator that matches 12 elements, Playwright throws a **strict mode violation**:

  ```
  Error: locator.getByTestId('product-name') resolved to 12 elements
  ```

  Playwright's strict mode means: if a locator matches more than one element, any action on it fails. You must narrow the locator to a single element first — with `.first()`, `.nth(index)`, or a more specific selector.

</details>

---

### Exercise 5 — Three Ways to Find the Same Input

There is rarely only one correct locator. Understanding the options helps you choose the most resilient one.

```typescript
test('Exercise 5: three ways to find the email input', async ({ page }) => {
  await page.goto('/login');

  // Strategy 1: by label text (reads the <label> associated with the input)
  const byLabel = page.getByLabel('Email address');

  // Strategy 2: by placeholder attribute
  const byPlaceholder = page.getByPlaceholder('you@example.com');

  // Strategy 3: by data-testid (explicit test hook)
  const byTestId = page.getByTestId('login-email');

  // All three refer to the same element — all should be visible
  await expect(byLabel).toBeVisible();
  await expect(byPlaceholder).toBeVisible();
  await expect(byTestId).toBeVisible();

  // Confirm they are the same element by filling with one and reading with another
  await byLabel.fill('tester@example.com');
  await expect(byTestId).toHaveValue('tester@example.com');
});
```

📋 Which strategy is most resilient to a UI redesign? Rank the three from most to least brittle and explain why.

<details>
  <summary>Need some help?</summary>

  From most to least brittle:

  1. **`getByPlaceholder`** — brittle. Placeholder text is UX copy that product teams change frequently. It also duplicates visible text, making it easy to accidentally match the wrong element.

  2. **`getByLabel`** — good. Labels are tied to accessibility requirements and change less often than placeholder text. This is Playwright's recommended approach for form inputs.

  3. **`getByTestId`** — most stable. `data-testid` attributes exist purely for testing and are not changed as part of UX or styling work. They are explicit contracts between the developer and the tester.

  **General rule:** prefer `getByRole` or `getByLabel` for elements with natural accessibility semantics (buttons, inputs, links). Use `getByTestId` for custom components or when the semantic locator would be ambiguous.

</details>

---

### Exercise 6 — Asserting What Is NOT Visible

A passing test is not just about confirming what is there — it is equally important to confirm what should *not* be there.

```typescript
test('Exercise 6: conditional nav elements change with auth state', async ({ page }) => {
  await page.goto('/');

  // Before login: "Log in" is visible, "Log out" is not
  await expect(page.getByTestId('nav-login')).toBeVisible();
  await expect(page.getByTestId('nav-logout')).not.toBeVisible();

  // Log in
  await page.goto('/login');
  await page.getByTestId('login-email').fill('standard_user@example.com');
  await page.getByTestId('login-password').fill('Password123!');
  await page.getByTestId('login-submit').click();

  // After login: "Log out" is visible, "Log in" is gone
  await expect(page.getByTestId('nav-logout')).toBeVisible();
  await expect(page.getByTestId('nav-login')).not.toBeVisible();
});
```

📋 What is the difference between `not.toBeVisible()` and `not.toBeAttached()`? Would both work here?

<details>
  <summary>Need some help?</summary>

  - `not.toBeVisible()` — passes if the element exists in the DOM but is hidden (e.g. `display: none`, `visibility: hidden`, or zero opacity). It also passes if the element is not in the DOM at all.
  - `not.toBeAttached()` — passes only if the element does not exist in the DOM at all.

  On TestMart, the nav renders different elements depending on auth state — the login link is not rendered at all when logged in. So both assertions would pass. In general, `not.toBeVisible()` is the safer choice: it works whether the element is hidden *or* absent, and is less fragile across implementation changes.

</details>

---

## Part A — Checkpoint

Before continuing, run the full spec file:

```bash
npx playwright test
```

All 6 exercises must pass. If any fail, use `--debug` to step through and identify the issue:

```bash
npx playwright test --debug
```

---

*Proceed to **Session 3: Part B - First Full Journey** once all acceptance criteria are met.*
