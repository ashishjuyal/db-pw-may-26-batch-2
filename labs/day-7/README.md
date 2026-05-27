# Session 7 — BDD, Full API Automation & Mocking

> **Lab : BDD Scenario + Mock Backend**
> Write Cucumber scenarios backed by POM classes, and control the backend with `page.route()` to test your UI's error handling.

---

## Lab at a Glance

```
Part A        → 5 focused examples — one concept each
  Example 1   → Cucumber setup and project structure
  Example 2   → Writing good Gherkin — business language vs implementation detail
  Example 3   → The World class — sharing Playwright state across steps
  Example 4   → Step definitions backed by POM classes
  Example 5   → Network interception with page.route()
Part B        → BDD + Mock Product Catalogue
  Scenario 1  → Two mocked products appear in the UI
  Scenario 2  → Empty catalogue shows "No products found"
Lab           → Independent: checkout BDD scenario with payment error mocking
```

> **TestMart** must be running: `cd testmart && npm start`

---

## Prerequisites

- Session 5 lab completed — `tests/pages/login.page.ts`, `tests/pages/products.page.ts`, and `tests/pages/cart.page.ts` exist and pass
- TestMart running on `http://localhost:3000`

---

## Part A — BDD & Network Mocking

### Why This Matters

This session introduces three tools that solve three different problems you will encounter as soon as tests grow beyond a single file:

- **Cucumber** solves the communication problem: business stakeholders cannot read TypeScript, so tests are invisible to them. Gherkin gives them a way in. The risk is using Cucumber as a test wrapper without the collaboration it is designed for. Examples 1 through 4 show how to use it correctly.
- **`page.route()`** solves the environment dependency problem: tests that depend on a real backend fail when that backend is down, slow, or not seeded. Example 6 and Part B show how to own the backend from inside the test.

---

### Example 1 — Cucumber Setup

**What this covers:** installing the Cucumber runner and creating the folder structure that every example in this session depends on.

**1. Install the required packages:**

```bash
npm install --save-dev @cucumber/cucumber ts-node
```

**2. Create `cucumber.json` in the project root:**

```json
{
  "default": {
    "paths": ["tests/features/**/*.feature"],
    "require": ["tests/steps/**/*.ts", "tests/world/**/*.ts"],
    "requireModule": ["ts-node/register"],
    "parallel": 4,
    "format": ["progress-bar", "html:output/cucumber-report.html"]
  }
}
```

**3. Create the folder structure inside `tests/`:**

```bash
mkdir -p tests/features tests/steps tests/world
```

**4. Add a script to `package.json`:**

```json
"scripts": {
  "cucumber": "cucumber-js"
}
```

**5. Run Cucumber:**

```bash
npx cucumber-js
```

You should see: `0 scenarios (0 skipped)` — Cucumber found no feature files yet, which is expected.

📋 What do you think happens if you remove `"requireModule": ["ts-node/register"]` from `cucumber.json` and run again? Make a prediction, then try it.

<details>
<summary>Need some help?</summary>

Without `ts-node/register`, Node.js tries to execute the TypeScript step definition files as plain JavaScript — and immediately throws a syntax error on the first type annotation it encounters. Cucumber exits before running a single scenario. The `requireModule` setting tells Node.js to transform TypeScript before executing it.

</details>

**Verify:**
- [ ] `npx cucumber-js` runs without error and reports `0 scenarios`
- [ ] `output/cucumber-report.html` is created (empty report, but the folder exists)
- [ ] The folder structure `tests/features/`, `tests/steps/`, `tests/world/` exists

---

### Example 2 — Writing Good Gherkin

**What this covers:** the difference between Gherkin that a business stakeholder can verify and Gherkin that is just test code in disguise.

A developer on your team has written the following feature file. Read it carefully:

```gherkin
Feature: Product Search

  Scenario: Search for a product
    Given I click on data-testid="login-email" and type "standard_user@example.com"
    And I click on data-testid="login-password" and type "Password123!"
    And I click data-testid="login-submit"
    When I fill data-testid="search-input" with "Keyboard" and click data-testid="search-btn"
    Then data-testid="product-card" should have count 1
    And data-testid="product-name" should contain text "Mechanical Keyboard"
```

📋 Show this feature file to someone who does not know Playwright. Ask them: "Does this describe what our product is supposed to do?" What do you think they would say, and what is the core problem with this Gherkin?

<details>
<summary>Need some help?</summary>

The steps describe *how* the test clicks buttons and fills inputs — not *what* the user is trying to do. A Product Owner or Business Analyst would struggle to verify that this describes the feature they asked for because it is written in the language of the test tool, not the language of the business.

Good Gherkin describes intent, not mechanism. The step `I fill data-testid="search-input"` should be `I search for "Keyboard"`. The locator is an implementation detail; it belongs in the step definition, not the feature file.

</details>

**Rewrite it.** Create `tests/features/product-search.feature` with business-level Gherkin:

```gherkin
Feature: Product Search
  As a logged-in customer
  I want to search for products
  So that I can find what I need

  Background:
    Given I am logged in as a standard customer

  Scenario: Search returns a matching product
    When I search for "Keyboard"
    Then I should see 1 product in the results
    And the product name should be "Mechanical Keyboard"

  Scenario: Search with no results shows the empty state
    When I search for "xyzproductthatdoesnotexist"
    Then I should see the message "No products found"
```

📋 What does the `Background` block do, and when should you use it versus putting the step in each scenario directly?

<details>
<summary>Need some help?</summary>

`Background` runs before every scenario in the feature file — equivalent to a `beforeEach` hook scoped to this file. Use it for setup that every scenario in this feature requires. In this case, every search test needs a logged-in user, so the login step belongs in `Background`.

If only some scenarios need the setup, use scenario-specific `Given` steps instead. Putting unrelated setup in `Background` makes scenarios harder to read — the reader has to scroll up to understand what state each scenario starts in.

</details>

**Verify:**
- [ ] Your feature file uses no testids, CSS selectors, or method names
- [ ] A Product Owner who has not seen Playwright could read it and confirm it describes the expected feature
- [ ] `npx cucumber-js` now reports `2 scenarios (2 undefined)` — scenarios found, steps not yet implemented

---

### Example 3 — The World Class

**What this covers:** creating the `PlaywrightWorld` class that gives every step definition in a scenario access to the same `page`, `context`, and `browser`.

In Playwright tests, the `page` object is injected via fixtures and scoped to each test automatically. Cucumber has no such mechanism — you have to provide it. The World class is Cucumber's way of sharing state between steps in a scenario.

Create `tests/world/playwright-world.ts`:

```typescript
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';

export class PlaywrightWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext({
      baseURL: 'http://localhost:3000',
    });
    this.page = await this.context.newPage();
  }

  async teardown(): Promise<void> {
    await this.context.close();
    await this.browser.close();
  }
}

setWorldConstructor(PlaywrightWorld);
```

📋 A Playwright test has fixtures — each test gets a fresh `page` automatically. In Cucumber, when does a new World instance get created? What is the consequence if two scenarios share the same World instance?

<details>
<summary>Need some help?</summary>

Cucumber creates a new World instance for each scenario. This is why step definitions call `this.init()` inside a `Before` hook (not in the constructor) and `this.teardown()` inside an `After` hook — each scenario gets a fresh browser context with no history, cookies, or state from previous scenarios.

If two scenarios shared the same World instance, a cookie set by Scenario 1 (the login cookie, for example) would still be present when Scenario 2 runs. Tests would pass or fail depending on execution order — the behaviour every test suite must avoid.

</details>

**Verify:**
- [ ] `tests/world/playwright-world.ts` compiles without errors: `npx tsc --noEmit`
- [ ] `npx cucumber-js` still reports `2 scenarios (2 undefined)` — the World class is loaded but no steps are defined yet

---

### Example 4 — Step Definitions Backed by POM Classes

**What this covers:** connecting the Gherkin scenarios from Example 2 to Playwright code by writing step definitions that delegate to your Session 4 POM classes.

Create `tests/steps/product-search.steps.ts`:

```typescript
import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../world/playwright-world';
import { LoginPage } from '../pages/login.page';
import { ProductsPage } from '../pages/products.page';

Before(async function (this: PlaywrightWorld) {
  await this.init();
});

After(async function (this: PlaywrightWorld) {
  await this.teardown();
});

Given('I am logged in as a standard customer', async function (this: PlaywrightWorld) {
  const loginPage = new LoginPage(this.page);
  await loginPage.navigate('/login');
  await loginPage.login('standard_user@example.com', 'Password123!');
});

When('I search for {string}', async function (this: PlaywrightWorld, query: string) {
  const productsPage = new ProductsPage(this.page);
  await productsPage.goto();
  await productsPage.search(query);
});

Then('I should see {int} product in the results', async function (this: PlaywrightWorld, count: number) {
  await expect(this.page.getByTestId('product-card')).toHaveCount(count);
});

Then('the product name should be {string}', async function (this: PlaywrightWorld, name: string) {
  await expect(this.page.getByTestId('product-name').first()).toHaveText(name);
});

Then('I should see the message {string}', async function (this: PlaywrightWorld, message: string) {
  await expect(this.page.getByTestId('no-results-message')).toHaveText(message);
});
```

Run the scenarios:

```bash
npx cucumber-js
```

Both scenarios should pass.

📋 Look at the `I search for {string}` step. It creates a new `ProductsPage` instance on every call. In the `I am logged in` step, a new `LoginPage` is also created. What would happen if you stored these POM instances on `this` (the World) in the `Before` hook instead of creating them inside each step?

<details>
<summary>Need some help?</summary>

Storing page objects on the World in `Before` is a valid alternative — it avoids recreating them inside each step. The tradeoff is that the World class would need to know about every page object in the project, coupling them together.

The approach shown — creating POM instances inside the steps that need them — keeps the World minimal. The `page` object (the expensive resource) is created once per scenario via `init()`; the POM wrappers (just thin TypeScript objects) are cheap to create.

Both patterns are used in production projects. The Session 4 approach (fixtures injecting pre-created page objects) is idiomatic for pure Playwright tests; the step-local instantiation shown here is idiomatic for Cucumber projects where page objects are not injected by a test runner.

</details>

**Verify:**
- [ ] `npx cucumber-js` reports `2 scenarios (2 passed)`
- [ ] The step definitions contain no locators directly — all interactions go through `LoginPage` and `ProductsPage`
- [ ] You can explain to a partner why the `Before` and `After` hooks call `init()` and `teardown()` rather than putting that logic in the World constructor

---

### Example 5 — Network Interception with page.route()

**What this covers:** returning a controlled response from within a Playwright test, without hitting the real backend.

The products page (`/products`) is **server-side rendered** — the EJS template populates the product grid directly from the database on the initial page load. `page.route()` only intercepts `fetch()` network calls made by JavaScript; it has no effect on HTML that the server rendered before the page reached the browser. To see mock data, we must trigger the client-side search, which fires `fetch('/api/products?...')` and is intercepted by our route handler.

Create `tests/mocking/product-mock.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

const mockProducts = [
  { id: 999, name: 'Mock Widget', description: 'Test item', price: 9.99, category: 'Electronics', stock: 5, image_url: '/images/placeholder.svg' },
  { id: 998, name: 'Mock Gadget', description: 'Test item 2', price: 49.99, category: 'Accessories', stock: 10, image_url: '/images/placeholder.svg' },
];

test('mock products appear in the UI', async ({ page }) => {
  // **/api/products* catches the empty query string (?...) that URLSearchParams appends
  await page.route('**/api/products*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ products: mockProducts, count: mockProducts.length }),
    });
  });

  await page.goto('/products');

  // Click Search to trigger the client-side fetch — the route intercepts it
  await page.getByTestId('search-btn').click();
  await expect(page.getByTestId('loading-spinner')).not.toBeVisible();

  await expect(page.getByTestId('product-card')).toHaveCount(2);
  await expect(page.getByTestId('product-name').nth(0)).toHaveText('Mock Widget');
  await expect(page.getByTestId('product-name').nth(1)).toHaveText('Mock Gadget');
});
```

Run it:

```bash
npx playwright test tests/mocking/product-mock.spec.ts
```

Now **remove the `search-btn` click and the spinner wait**, leaving only `await page.goto('/products')` before the assertions. Run the test again.

📋 What happens, and why? What does this tell you about the difference between server-rendered content and client-side data fetching?

<details>
<summary>Need some help?</summary>

The test fails: `toHaveCount(2)` fails because the page shows the real server-rendered catalogue (around 11 products), not the 2 mock products. The route was registered and navigation completed — but no `fetch()` call was made to `/api/products` during the initial load. The server rendered the product grid directly in the HTML.

`page.route()` intercepts network requests that JavaScript makes after the page loads. It cannot intercept HTML content that the server embedded in the response before the browser received it.

The fix is clicking the search button, which triggers `fetchProducts()` in `products.js`. That function calls `fetch('/api/products?...')`, which is intercepted by the route, and `renderProducts()` replaces the server-rendered grid with the mock data.

</details>

**Now add a second test** for the empty-catalogue case:

```typescript
test('empty catalogue shows "No products found"', async ({ page }) => {
  await page.route('**/api/products*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ products: [], count: 0 }),
    });
  });

  await page.goto('/products');
  await page.getByTestId('search-btn').click();
  await expect(page.getByTestId('loading-spinner')).not.toBeVisible();

  // The empty-state element becomes visible; the server-rendered cards are hidden
  await expect(page.getByTestId('no-results-message')).toBeVisible();
});
```

**Verify:**
- [ ] Both mock tests pass
- [ ] You can explain why clicking `search-btn` is required to see the mock data
- [ ] You understand the difference between `route.fulfill()` (return mock) and `route.continue()` (forward to real server)

---

## Validate Database Side Effects Directly

The API response after placing an order tells you the order was created. But it does not tell you everything the backend did:

- Was the product's stock decremented?
- Was the user's cart cleared?
- Was the price at order time locked in — not the current product price?

These side effects matter but are invisible to the API response. This is when querying the database directly adds value that no API call can replace.

**Install the database driver:**

```bash
npm install --save-dev better-sqlite3 @types/better-sqlite3
```

`better-sqlite3` is a synchronous SQLite driver. It reads TestMart's database file directly — no server required, no port, no credentials.

```typescript
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(
  path.resolve(process.cwd(), 'testmart/testmart.db'),
  { readonly: true }
);

test('Exercise 6: placing an order triggers the correct database side effects', async ({ request }) => {
  // Authenticate
  const loginRes = await request.post('/api/auth/login', {
    data: { email: 'standard_user@example.com', password: 'Password123!' }
  });
  const { token, user } = await loginRes.json();

  // Record stock BEFORE
  const before = db.prepare('SELECT stock FROM products WHERE id = ?').get(1) as { stock: number };

  // Add product 1 to cart
  await request.post('/api/cart', {
    headers: { Cookie: `token=${token}` },
    data: { product_id: 1 }
  });

  // Place order
  const orderRes = await request.post('/api/orders', {
    headers: { Cookie: `token=${token}` }
  });
  expect(orderRes.status()).toBe(201);
  const { order } = await orderRes.json();

  // DB assertion 1: stock was decremented by exactly 1
  const after = db.prepare('SELECT stock FROM products WHERE id = ?').get(1) as { stock: number };
  expect(after.stock).toBe(before.stock - 1);

  // DB assertion 2: cart was cleared after checkout
  const cartCount = db.prepare(
    'SELECT COUNT(*) AS count FROM cart_items WHERE user_id = ?'
  ).get(user.id) as { count: number };
  expect(cartCount.count).toBe(0);

  // DB assertion 3: price was locked at purchase time, not the current product price
  const items = db.prepare(
    'SELECT * FROM order_items WHERE order_id = ?'
  ).all(order.id) as Array<{ product_id: number; quantity: number; price: number }>;
  expect(items).toHaveLength(1);
  expect(items[0].price).toBeCloseTo(order.items[0].price, 2);
});
```

📋 Why is `{ readonly: true }` important when the database is shared with a running TestMart server?

<details>
  <summary>Need some help?</summary>

  `better-sqlite3` opens the SQLite file directly on disk. Without `readonly: true`, the driver acquires a write lock on the database. This can block or corrupt concurrent writes from the TestMart server — which is also writing to the same file when orders, carts, or sessions change.

  Opening in read-only mode makes the connection safe to hold alongside a live server. It also makes your intent explicit: tests that validate state should never change it. If a DB validation test accidentally mutates data, later tests run in a different order may fail in ways that are very hard to trace.

</details>

---


