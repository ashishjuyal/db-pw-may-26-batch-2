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

## Part B — First Full Journey

You have practised every building block in Part A. Now combine them. Create a new spec file:

```bash
touch tests/login-flow.spec.ts
```

Below is the test structure with the expected outcome for each step. **Your job is to write the locators and assertions** — do not look at the solution until you have made a genuine attempt. Use `testmart.md` for the exact testids and `playwright.config.ts` `baseURL` is already set to `http://localhost:3000`.

```typescript
import { test, expect } from '@playwright/test';

test('login, search for a product, and logout', async ({ page }) => {

  // ── Step 1: Open the home page ────────────────────────────────────────────
  // Navigate to '/'
  // Prove you are NOT logged in: the login nav link should be visible

  // ── Step 2: Go to the login page and log in ───────────────────────────────
  // Click the login link in the nav
  // Fill in email: standard_user@example.com
  // Fill in password: Password123!
  // Submit the form
  // Prove the URL changed to contain /login before the redirect

  // ── Step 3: Confirm login succeeded ──────────────────────────────────────
  // Prove the logout nav link is now visible
  // Prove the nav shows the user's first name ("Alex")

  // ── Step 4: Search for a product ─────────────────────────────────────────
  // Navigate to the products page using the nav link
  // Type "Keyboard" into the search input
  // Trigger the search
  // Wait for the results to load (there is an async fetch — how do you know when it's done?)
  // Prove exactly 1 product card is visible

  // ── Step 5: Verify the result ─────────────────────────────────────────────
  // Prove the product name is "Mechanical Keyboard"

  // ── Step 6: Log out ───────────────────────────────────────────────────────
  // Click the logout nav link
  // Prove the login nav link is visible again
  // Prove the URL is back to '/'

});
```

Run after completing each step so you catch errors early:

```bash
npx playwright test tests/login-flow.spec.ts --headed
```

📋 Step 4 requires waiting for an async search fetch. How do you know when the results have finished loading — what is the visible signal on the page?

<details>
  <summary>Need some help?</summary>

  TestMart shows a loading spinner (`data-testid="loading-spinner"`) while the fetch runs and hides it when the results arrive. Assert that the spinner appears, then assert that it disappears — only then count the results.

  ```typescript
  await expect(page.getByTestId('loading-spinner')).toBeVisible();
  await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
  ```

  Counting results before the spinner disappears will fail intermittently — that's the definition of a flaky test.

</details>

📋 Step 3 asks you to assert the user's first name. The nav shows "Alex" but you need to assert exactly that text. Which assertion lets you check the exact text content of an element?

<details>
  <summary>Need some help?</summary>

  Use `toHaveText()` — it asserts the element's visible text content and auto-retries:

  ```typescript
  await expect(page.getByTestId('nav-username')).toHaveText('Alex');
  ```

  `toBeVisible()` only confirms the element is present — it does not check what it says.

</details>

### Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `TimeoutError: Waiting for locator` | Wrong testid or element not rendered | Run `--debug`, hover over elements with the locator picker to confirm testids |
| Login redirects but `nav-logout` not found | Testid typo | Check `testmart.md` — the exact testid is `nav-logout`, not `logout` |
| Search returns 0 results | TestMart DB needs reseed | `cd testmart && npm run reset` |
| `toHaveCount(1)` fails with count 12 | Spinner wait missing — results asserted before fetch completed | Add the two spinner assertions before `toHaveCount` |

<details>
  <summary>🔓 Full solution — only open this if you have been stuck for 10+ minutes and the hints above have not unblocked you</summary>

```typescript
import { test, expect } from '@playwright/test';

test('login, search for a product, and logout', async ({ page }) => {

  // Step 1: Open the home page — confirm not logged in
  await page.goto('/');
  await expect(page.getByTestId('nav-login')).toBeVisible();

  // Step 2: Navigate to login and submit credentials
  await page.getByTestId('nav-login').click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByTestId('login-email').fill('standard_user@example.com');
  await page.getByTestId('login-password').fill('Password123!');
  await page.getByTestId('login-submit').click();

  // Step 3: Confirm login succeeded
  // toBeVisible() not toHaveURL() — redirect destination varies; nav state is the reliable signal
  await expect(page.getByTestId('nav-logout')).toBeVisible();
  // toHaveText() not toBeVisible() — confirms the correct user is shown, not just any username
  await expect(page.getByTestId('nav-username')).toHaveText('Alex');

  // Step 4: Search and wait for async results
  await page.getByTestId('nav-products').click();
  await page.getByTestId('search-input').fill('Keyboard');
  await page.getByTestId('search-btn').click();
  // Spinner appearing confirms the fetch started; disappearing confirms it finished
  // Asserting count before the spinner disappears is the most common source of flakiness here
  await expect(page.getByTestId('loading-spinner')).toBeVisible();
  await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
  await expect(page.getByTestId('product-card')).toHaveCount(1);

  // Step 5: Verify the product name
  await expect(page.getByTestId('product-name')).toHaveText('Mechanical Keyboard');

  // Step 6: Log out and confirm the session is cleared
  await page.getByTestId('nav-logout').click();
  await expect(page.getByTestId('nav-login')).toBeVisible();
  await expect(page).toHaveURL('/');
});
```

</details>

---

## Run, Verify and Explore the Report

Run the entire test suite (all spec files):

```bash
npx playwright test
npx playwright show-report
```

In the HTML report:

- [ ] Both spec files are listed
- [ ] All 7 tests pass (6 exercises + 1 journey)
- [ ] Click the login-flow test row — each `await` step is listed with its duration

Now **deliberately break** the journey test to see what a failure looks like. Change the search term so it returns no results:

```typescript
await page.getByTestId('search-input').fill('XXXXXXXXXXX');
```

Re-run, open the report, and confirm:

- [ ] The failure shows on the `toHaveCount(1)` assertion
- [ ] A screenshot is attached showing the empty results state
- [ ] The error message shows `Expected: 1 / Received: 0`

Revert the change before moving on.

---

## Extension — Run Across Browsers

Run the same tests on Firefox and WebKit without changing any code:

```bash
npx playwright test --project=firefox
npx playwright test --project=webkit
```

Or all three simultaneously:

```bash
npx playwright test --project=chromium --project=firefox --project=webkit
```

The HTML report shows each test three times — once per browser. Check whether any browser behaves differently with the async spinner pattern.

> Firefox and WebKit must be installed: `npx playwright install firefox webkit`

---

## ✅ Acceptance Criteria

- [ ] All 6 Part A exercises pass
- [ ] The Login → Search → Logout journey passes on 3 consecutive runs
- [ ] All locators use `getByRole`, `getByLabel`, `getByTestId`, or `getByPlaceholder` — no raw CSS selectors
- [ ] No `waitForTimeout` calls anywhere
- [ ] The HTML report shows all tests passing with steps visible
- [ ] You can explain to a partner: (a) why `.first()` is needed with repeated elements, (b) why `not.toBeVisible()` is safer than `not.toBeAttached()`, (c) what the spinner assertion pattern proves

---

## Key Playwright APIs Used in This Lab

| API | What It Does |
|-----|-------------|
| `page.goto(url)` | Navigate to a URL relative to `baseURL` |
| `page.getByRole(role, { name })` | Find element by ARIA role — most resilient strategy |
| `page.getByLabel(text)` | Find input by its associated `<label>` |
| `page.getByPlaceholder(text)` | Find input by placeholder text |
| `page.getByTestId(id)` | Find element by `data-testid` attribute |
| `page.getByText(text)` | Find element by visible text content |
| `locator.first()` | Narrow a multi-match to the first element |
| `locator.nth(n)` | Narrow to the nth element (0-indexed) |
| `locator.count()` | Return the number of matching elements |
| `locator.fill(value)` | Clear and type text into an input |
| `locator.click()` | Click an element |
| `locator.textContent()` | Read the text content of an element |
| `expect(locator).toBeVisible()` | Assert element is visible (auto-retries) |
| `expect(locator).not.toBeVisible()` | Assert element is hidden or absent |
| `expect(locator).toHaveText(text)` | Assert exact or partial text match |
| `expect(locator).toHaveCount(n)` | Assert the number of matching elements |
| `expect(locator).toHaveValue(text)` | Assert the value of an input field |
| `expect(page).toHaveURL(pattern)` | Assert the current URL |
| `expect(page).toHaveTitle(pattern)` | Assert the page title |

---

## Lab

You have automated the Login → Search → Logout journey with guided steps. Now write a second test entirely on your own.

Write a Playwright test that covers the following journey on TestMart without any step-by-step guidance:

1. Navigate to the Products page without logging in
2. Filter products by the **Electronics** category and verify that only Electronics products are shown
3. Click through to any product detail page and assert that the product name, price, and stock badge are all visible
4. Attempt to add the product to the cart — since you are not logged in, the app should redirect you to the login page
5. Log in using the standard user credentials
6. Verify you are redirected back to the products area after login

Your test must follow the same rules as the guided lab — role-based or testid-based locators, no `waitForTimeout`, and it must pass on three consecutive runs.

> Stuck? Try the [hints](hints.md) or check the [solution](solution.md).

---

*Proceed to **Session 3 — Stability, Assertions & Page Object Model** once all acceptance criteria are met.*
