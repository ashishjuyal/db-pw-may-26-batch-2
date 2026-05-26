# Session 5 — Playwright Project Configuration, POM & Hybrid Testing

### Playwright Project Configuration

#### What are Playwright projects?

A "project" in `playwright.config.ts` is a named execution configuration. The `projects` array lets you run the same test suite — or different subsets of it — under different settings, in a single `npx playwright test` call.

Without projects, everything runs as one flat block under the same retry count, browser settings, and test scope. That works for small suites. As a suite grows you hit real needs: smoke tests that must fail immediately with zero retries; regression tests that get two retries for transient flakiness; tests that require a pre-authenticated browser or a seeded database before they start. Projects let you express all of this in one place.

---

#### Step 1: Splitting Smoke and Regular Tests

The simplest use of projects is a two-tier split. `testMatch` includes files whose path matches a glob. `testIgnore` excludes them. Name your fast signal tests `*.smoke.test.ts` and the config wires up automatically — no manual grouping needed.

**Recommended folder layout:**

```
tests/
└── specs/
    ├── login.smoke.test.ts      ← Smoke project picks this up
    ├── products.smoke.test.ts   ← Smoke project picks this up
    ├── cart.test.ts             ← Regular project picks this up
    └── checkout.test.ts         ← Regular project picks this up
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  projects: [
    {
      name: 'Smoke',
      testMatch: '**/*.smoke.test.ts',  // only files ending in .smoke.test.ts
      retries: 0,                        // fail immediately — no retries for a signal test
    },
    {
      name: 'Regular',
      testIgnore: '**/*.smoke.test.ts', // everything that is NOT a smoke test
      retries: 2,                        // allow 2 retries for transient failures
      use: {
        // project-level browser/context overrides go here
        // e.g. viewport, trace, video, baseURL
      },
    },
  ],
});
```

**Running a single project:**

```bash
npx playwright test --project=Smoke    # only smoke tests
npx playwright test --project=Regular  # only regular tests
npx playwright test                    # all projects
```

📋 What happens to a test file accidentally named `login.test.ts` instead of `login.smoke.test.ts`? Which project picks it up, and what is the practical consequence?

<details>
  <summary>Need some help?</summary>

  `login.test.ts` does not match `**/*.smoke.test.ts`, so Smoke ignores it. It is not excluded by `testIgnore` in Regular, so Regular picks it up — with 2 retries, not 0.

  If it was intended as a fast signal test, retries slow it down and mask genuine failures. Naming conventions are load-bearing here: the config relies on them. A team rule like "smoke tests must end in `.smoke.test.ts`" is easy to enforce in code review and makes the intent visible in the filename itself.

</details>

---

#### Step 2: Global Setup with Dependencies

> **Keep setup files in a dedicated folder.**
>
> As projects multiply, mixing setup files with test files in a flat `tests/` directory makes `testMatch` patterns error-prone and the project structure hard to read. A `tests/setup/` subfolder keeps them visually and semantically separate. Setup files are not tests — they are infrastructure.
>
> ```
> tests/
> ├── setup/
> │   ├── global.setup.ts        ← global one-time setup
> │   ├── admin-auth.setup.ts    ← saves admin auth state to disk
> │   └── populate-db.setup.ts   ← seeds test data via the TestMart API
> └── specs/
>     └── global_config.test.ts  ← actual test file with setup dependencies
> ```

Some tests need the world to be in a specific state before they run: a user logged in, the database seeded, a feature flag active. The `dependencies` property on a project declares which setup projects must complete successfully before this project's tests start.

**Key rules for dependencies:**
- All dependencies run before the dependent project starts
- Dependencies do not run in a guaranteed order relative to each other — they may run in parallel. Make sure they do not share mutable state
- If any dependency fails, the dependent project does not run
- `dependencies` takes project **names**, not file names

**The setup files:**

```typescript
// tests/setup/global.setup.ts
import { test as setup } from '@playwright/test';

setup.use({});

setup('global setup', async ({ page }) => {
  // One-time global state: environment checks, feature flags, global tokens
  console.log('Global setup running...');
});
```

```typescript
// tests/setup/admin-auth.setup.ts
import { test as setup } from '@playwright/test';

setup('admin auth setup', async ({ page }) => {
  // Log in as admin through the UI and save the browser session to disk.
  // Other tests can load this saved state instead of logging in every time.
  await page.goto('/login');
  await page.getByTestId('login-email').fill('admin@example.com');
  await page.getByTestId('login-password').fill('Admin123!');
  await page.getByTestId('login-submit').click();
  await page.context().storageState({ path: 'tests/setup/.auth/admin.json' });
  console.log('Admin auth state saved');
});
```

```typescript
// tests/setup/populate-db.setup.ts
import { test as setup, request } from '@playwright/test';

setup('populate db setup', async ({}) => {
  // Create test data via the TestMart REST API — no browser needed
  const context = await request.newContext({ baseURL: 'http://localhost:3000' });

  const loginRes = await context.post('/api/auth/login', {
    data: { email: 'admin@example.com', password: 'Admin123!' },
  });
  const { token } = await loginRes.json();

  await context.post('/api/products', {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: 'Setup Test Product', description: 'Created by setup', price: 9.99, category: 'Electronics', stock: 50 },
  });

  await context.dispose();
  console.log('Database populated');
});
```

```typescript
// tests/specs/global_config.test.ts
import { test } from '@playwright/test';

test.use({ headless: true });

test('Test 1', async ({ page }) => {
  await page.goto('/');
  await page.goBack();
  console.log('test running...');
});
```

**The config with dependencies:**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  projects: [
    {
      name: 'setup-cleanup-demo',
      testMatch: '**/global_config.test.ts',
      dependencies: ['setup', 'admin-auth', 'populate-db'],
      // All three run before this project starts.
      // They do not run in order — make sure they are not interdependent.
    },
    {
      name: 'setup',
      testMatch: '**/global.setup.ts',
    },
    {
      name: 'admin-auth',
      testMatch: '**/admin-auth.setup.ts',
    },
    {
      name: 'populate-db',
      testMatch: '**/populate-db.setup.ts',
    },
  ],
});
```

When you run `npx playwright test`, Playwright resolves the dependency graph first. The three setup projects run (in parallel where possible), then `setup-cleanup-demo` starts once all three pass.

📋 `admin-auth.setup.ts` and `populate-db.setup.ts` are declared as independent parallel dependencies. But `populate-db` calls the API using admin credentials. Does `populate-db` depend on `admin-auth`? Why or why not?

<details>
  <summary>Need some help?</summary>

  No — they are genuinely independent.

  `admin-auth.setup.ts` saves a browser session (cookies and local storage) to a file on disk so that future UI tests can skip the login page. `populate-db.setup.ts` logs into the API directly with its own `request.newContext()` — it does not load the saved session file. It creates its own token in memory, uses it, then disposes the context.

  The two setups share the same credentials but not each other's output. Neither waits for the other, and neither would break if the other ran first or was removed entirely.

  The rule to watch for: if `populate-db` had contained `storageState: { path: 'tests/setup/.auth/admin.json' }` to reuse the saved session, it would have depended on `admin-auth` completing first. That hidden ordering requirement would be a bug — Playwright does not guarantee parallel dependency order.

</details>

---

#### Step 3: Teardown

After tests finish you often need to clean up: delete seeded data, revoke tokens, reset flags. The `teardown` property names a project that runs after the named project completes — whether the tests passed, failed, or were interrupted.

**Where to put teardown — Playwright's recommendation:**

Set `teardown` on the **setup project**, not on the dependent project. This makes the setup/teardown pair self-contained. If you later add more projects that depend on the same setup, the teardown still runs exactly once — tied to the setup lifecycle, not to any individual dependent.

Setting `teardown` on the dependent project also works, but only correctly when there is a single dependent. With multiple dependents, the teardown would need to be declared on each one and could run multiple times.

Note: `teardown` takes a single project name — it cannot be an array. If you need multiple cleanup steps, combine them into one teardown file.

```typescript
// tests/setup/global.teardown.ts
import { test as teardown } from '@playwright/test';

teardown('global teardown', async ({ page }) => {
  // Delete test data created during setup, revoke tokens, reset state
  console.log('Teardown running...');
});
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  projects: [
    {
      name: 'setup-cleanup-demo',
      testMatch: '**/global_config.test.ts',
      dependencies: ['setup', 'admin-auth', 'populate-db'],
      // teardown: 'cleanup', // valid here, but not recommended — see setup project below
    },
    {
      name: 'setup',
      testMatch: '**/global.setup.ts',
      teardown: 'cleanup', // recommended: teardown declared on the setup project
    },
    {
      name: 'cleanup',
      testMatch: '**/global.teardown.ts',
    },
    {
      name: 'admin-auth',
      testMatch: '**/admin-auth.setup.ts',
    },
    {
      name: 'populate-db',
      testMatch: '**/populate-db.setup.ts',
    },
  ],
});
```

**Execution order with teardown:**

```
setup ─┐
admin-auth ─┼─ run in parallel (no guaranteed order between them)
populate-db ─┘
      ↓
setup-cleanup-demo  (tests run)
      ↓
cleanup  (teardown runs — even if tests failed or were interrupted)
```

📋 `teardown` is set on the `setup` project rather than on `setup-cleanup-demo`. What guarantee does Playwright make about when cleanup runs if you move it to `setup-cleanup-demo` and a second project is later added that also depends on `setup`?

<details>
  <summary>Need some help?</summary>

  If `teardown` is on `setup-cleanup-demo` and a second project `feature-tests` is added with the same `dependencies: ['setup', ...]`, cleanup would need to be added to `feature-tests` as well — otherwise it would not run when `feature-tests` is the last project standing.

  With two dependents both declaring `teardown: 'cleanup'`, cleanup runs twice — once after each dependent finishes. Depending on what cleanup does (truncating a database table, for example), running it twice could break the second dependent's run if they overlap in execution.

  Keeping teardown on the setup project avoids this entirely: Playwright runs it once, after all projects that depend on `setup` have completed, regardless of how many dependents exist now or in the future.

</details>

---

> **Lab: Page Object Model + API Preconditioning**
> Build reusable page objects that make tests readable and maintainable — then combine them with Playwright's API layer to create fast, reliable hybrid tests.

---

## Lab at a Glance

```
Part A        → 5 POM examples — one concept each
  Example 1   → The maintenance problem — why POM exists
  Example 2   → BasePage — the shared foundation
  Example 3   → LoginPage — first page object
  Example 4   → ProductsPage and CartPage
  Example 5   → Playwright fixtures — the glue
Part B        → Hybrid Testing: API + UI
  Exercise 1  → First API call: GET /api/products
  Exercise 2  → API + UI: two views of the same data
  Exercise 3  → Login bypass: inject a session cookie
  Exercise 4  → Create data via API, verify in UI
  Exercise 5  → Assert the API after a UI action
  Full flow   → ApiClient class + full hybrid journey using POM
Lab           → Independent: full checkout flow using POM + API preconditioning
```

> **TestMart** must be running: `cd testmart && npm start`

---

## Prerequisites

- Session 3 lab completed — `tests/advanced.spec.ts` passes
- TestMart running on `http://localhost:3000`

---

## Part A — Page Object Model

### Why This Matters

Open your `tests/login-flow.spec.ts` from Session 2. The test that logs in and verifies the dashboard probably contains something like this:

```typescript
await page.getByTestId('login-email').fill('standard_user@example.com');
await page.getByTestId('login-password').fill('Password123!');
await page.getByTestId('login-submit').click();
await expect(page.getByTestId('nav-username')).toBeVisible();
```

Those four lines are fine for one test. But a real application has dozens of tests that need authentication. In a 40-test suite, those same four lines appear in every test that requires a logged-in user — 40 times, across multiple files. When the developer renames `login-submit` to `submit-btn`, every one of those 40 lines breaks.

The Page Object Model solves this at the source. You encapsulate the "how" (which locators, which actions) inside a class, and the test only expresses the "what":

**Before:**
```typescript
await page.getByTestId('login-email').fill('standard_user@example.com');
await page.getByTestId('login-password').fill('Password123!');
await page.getByTestId('login-submit').click();
```

**After:**
```typescript
await loginPage.login('standard_user@example.com', 'Password123!');
```

When `login-submit` changes, you update one line in `login.page.ts`. Every test that calls `loginPage.login()` continues to pass without touching the test files.

By the end of Part A, your tests will look like this:

```typescript
test('add product to cart', async ({ loginPage, productsPage, cartPage }) => {
  await loginPage.login('standard_user@example.com', 'Password123!');
  await productsPage.goto();
  await productsPage.search('Keyboard');
  await productsPage.addToCart('Mechanical Keyboard');
  await expect(cartPage.cartCount).toHaveText('1');
});
```

The test reads like a specification. No testids, no waits, no boilerplate — just the user journey. That is the destination you are working toward.

---

Create the folder structure before starting:

```bash
mkdir -p tests/pages tests/fixtures
```

---

### Example 1 — The Maintenance Problem

No new code to write in this example. The goal is to see the problem clearly before solving it.

Open your `tests/login-flow.spec.ts` from Session 2. Find everywhere you interact with the login form: filling the email, filling the password, clicking submit, asserting the nav shows the username.

Count how many times those four interactions appear. Now imagine you have 10 spec files, each with 4–5 tests that need login.

📋 If the designer renames `login-submit` to `submit-btn`, what is the exact scope of the change in a suite that uses raw locators everywhere versus a suite that uses a `LoginPage` class?

<details>
  <summary>Need some help?</summary>

  **Raw locators everywhere:** every test that calls `getByTestId('login-submit')` must be updated. In a 40-test suite with 30 tests that log in, that is 30 individual line changes across multiple files. Each is an opportunity to miss a file or introduce a typo.

  **With a LoginPage class:** `login-submit` appears exactly once — inside `loginPage.login()`. You change one line. Every test that calls `loginPage.login()` continues to work without modification.

  This is the core value of POM: it makes your tests resilient to UI changes by centralising the "how to interact with a page" in one place.

</details>

---

### Example 2 — BasePage: The Shared Foundation

Every page object in your suite needs access to `page`. Rather than passing it through every method, store it once in a base class that all page objects extend.

Create `tests/pages/base.page.ts`:

```typescript
import { Page } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }
}
```

Two things to notice:

1. `protected page: Page` — `protected` means `page` is accessible in subclasses but not from outside the class hierarchy.
2. `goto(path)` — a shared navigation helper every page object inherits automatically.

📋 Why `protected` instead of `private`? What breaks if you change it to `private` and then try to call `this.page.getByTestId(...)` inside a subclass?

<details>
  <summary>Need some help?</summary>

  `private` means only the class that declared the property can access it. If `page` were private on `BasePage`, a subclass like `LoginPage` could not call `this.page.getByTestId(...)` — TypeScript would give a compile error: "Property 'page' is private and only accessible within class 'BasePage'."

  `protected` gives subclasses access while still hiding the property from outside callers. Test code can call `loginPage.login(...)` but cannot access `loginPage.page` directly — which is the right boundary.

</details>

---

### Example 3 — LoginPage: First Page Object

Create `tests/pages/login.page.ts`:

```typescript
import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async login(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.getByTestId('login-email').fill(email);
    await this.page.getByTestId('login-password').fill(password);
    await this.page.getByTestId('login-submit').click();
    await expect(this.page.getByTestId('nav-username')).toBeVisible();
  }

  get errorMessage() {
    return this.page.getByTestId('login-error');
  }
}
```

Now write a test that uses it. Create `tests/pom-examples.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';

test('login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('standard_user@example.com', 'Password123!');
  await expect(page.getByTestId('nav-username')).toBeVisible();
});

test('login with invalid credentials shows error', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await page.getByTestId('login-email').fill('wrong@example.com');
  await page.getByTestId('login-password').fill('WrongPass!');
  await page.getByTestId('login-submit').click();
  await expect(loginPage.errorMessage).toBeVisible();
  await expect(loginPage.errorMessage).toHaveText('Invalid email or password');
});
```

Run them:

```bash
npx playwright test tests/pom-examples.spec.ts
```

📋 `errorMessage` is a getter that returns a `Locator`. What is the difference between returning a `Locator` and returning `Promise<string>` (the resolved text value)?

<details>
  <summary>Need some help?</summary>

  A `Locator` is a description of how to find an element — it does not touch the DOM when you access it. When you pass it to `expect(...).toBeVisible()`, Playwright auto-retries the DOM lookup until the element appears or the timeout expires.

  If `errorMessage` returned `Promise<string>` (using `.textContent()` for example), the DOM lookup would happen immediately at the time the getter is called — before the error message has appeared. The test would get `null` or an empty string, and no retry would occur.

  Always expose locators from page objects, not resolved text values. Let `expect` handle the waiting.

</details>

---

### Example 4 — ProductsPage and CartPage

Create `tests/pages/products.page.ts`:

```typescript
import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class ProductsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/products');
  }

  async search(term: string) {
    await this.page.getByTestId('search-input').fill(term);
    await this.page.getByTestId('search-btn').click();
    await expect(this.page.getByTestId('loading-spinner')).not.toBeVisible();
  }

  get productCards() {
    return this.page.getByTestId('product-card');
  }

  get productNames() {
    return this.page.getByTestId('product-name');
  }

  async addToCart(productName: string) {
    await this.page.getByTestId('product-card')
      .filter({ hasText: productName })
      .getByTestId('add-to-cart-btn')
      .click();
  }
}
```

Create `tests/pages/cart.page.ts`:

```typescript
import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/cart');
  }

  get cartItems() {
    return this.page.getByTestId('cart-item');
  }

  get cartCount() {
    return this.page.getByTestId('cart-count');
  }

  async checkout() {
    await this.page.getByTestId('checkout-btn').click();
  }
}
```

Add a test to `tests/pom-examples.spec.ts`:

```typescript
import { LoginPage }    from './pages/login.page';
import { ProductsPage } from './pages/products.page';
import { CartPage }     from './pages/cart.page';

test('add product to cart and verify cart count', async ({ page }) => {
  const loginPage    = new LoginPage(page);
  const productsPage = new ProductsPage(page);
  const cartPage     = new CartPage(page);

  await loginPage.login('standard_user@example.com', 'Password123!');
  await productsPage.goto();
  await productsPage.search('Keyboard');
  await expect(productsPage.productCards).toHaveCount(1);
  await productsPage.addToCart('Mechanical Keyboard');
  await expect(cartPage.cartCount).toHaveText('1');
});
```

📋 You instantiated 3 page objects manually at the top of the test. If every test in the suite needs these 3 objects, what is the cost and how would you solve it?

<details>
  <summary>Need some help?</summary>

  Every test has 3 lines of setup before the test logic begins. In a 40-test suite that is 120 lines of identical boilerplate. If `LoginPage`'s constructor signature changes, you update 40 test files.

  The solution is Playwright fixtures — covered in the next example. Fixtures centralise object creation so tests receive page objects ready to use, with no boilerplate.

</details>

---

### Example 5 — Playwright Fixtures: The Glue

Fixtures extend Playwright's built-in `test` object to include your page objects. Tests destructure whatever they need — unused fixtures are never created.

Create `tests/fixtures/test-fixtures.ts`:

```typescript
import { test as base } from '@playwright/test';
import { LoginPage }    from '../pages/login.page';
import { ProductsPage } from '../pages/products.page';
import { CartPage }     from '../pages/cart.page';

type Fixtures = {
  loginPage:    LoginPage;
  productsPage: ProductsPage;
  cartPage:     CartPage;
};

export const test = base.extend<Fixtures>({
  loginPage:    async ({ page }, use) => { await use(new LoginPage(page)); },
  productsPage: async ({ page }, use) => { await use(new ProductsPage(page)); },
  cartPage:     async ({ page }, use) => { await use(new CartPage(page)); },
});

export { expect } from '@playwright/test';
```

Now update `tests/pom-examples.spec.ts` to import from the fixtures file instead of `@playwright/test`:

```typescript
import { test, expect } from './fixtures/test-fixtures';

test('add product to cart using fixtures', async ({ loginPage, productsPage, cartPage }) => {
  await loginPage.login('standard_user@example.com', 'Password123!');
  await productsPage.goto();
  await productsPage.search('Keyboard');
  await expect(productsPage.productCards).toHaveCount(1);
  await productsPage.addToCart('Mechanical Keyboard');
  await expect(cartPage.cartCount).toHaveText('1');
});
```

The 3 boilerplate instantiation lines are gone. The test describes the user journey — nothing else.

📋 A test that only destructures `{ loginPage }` never touches products or cart. Are `ProductsPage` and `CartPage` still instantiated?

<details>
  <summary>Need some help?</summary>

  No. Playwright fixtures are lazy — they are only created if the test function requests them by name. A test requesting `{ loginPage }` will create only a `LoginPage` instance. `ProductsPage` and `CartPage` are never instantiated, and their setup code never runs.

  This is the key advantage over `beforeEach`: a `beforeEach` that creates all 3 page objects runs for every test regardless of what the test needs. Fixtures create exactly what is requested.

</details>

---

## Part A — Checkpoint

Verify your folder structure before continuing:

```
tests/
├── pages/
│   ├── base.page.ts
│   ├── login.page.ts
│   ├── products.page.ts
│   └── cart.page.ts
├── fixtures/
│   └── test-fixtures.ts
└── pom-examples.spec.ts
```

Run:

```bash
npx playwright test tests/pom-examples.spec.ts
```

All 3 tests must pass before continuing to Part B.

---

## Part B — Hybrid Testing: API + UI

### Why API Preconditioning?

Your page objects are now clean and reusable. But your tests still depend on the 12 seed products that exist when TestMart starts up. If another test deletes a product, or if the database is reset mid-suite, your tests break for reasons that have nothing to do with the feature you are testing.

**The problem with shared seed data:**

```
Test A (your test)       Test B (someone else's)
────────────────         ──────────────────────
navigate to /products    DELETE /api/products/1
assert 12 products  ←── product 1 is gone
FAILS with count 11      (not your fault)
```

**The solution — each test owns its data:**

```
Test A: POST /api/products  → create "My Test Product"
Test A: navigate            → search for "My Test Product"
Test A: assert exactly 1 result
Test A: DELETE /api/products/{id}  ← clean up
```

Now Test B can do anything to the seed data — Test A is unaffected.

Playwright's `request` fixture makes this possible without leaving the test file.

Create a new file for these exercises:

```bash
touch tests/api-exercises.spec.ts
```

---

### Exercise 1 — First API Call with the `request` Fixture

The `request` fixture is a full HTTP client built into Playwright. It uses the same `baseURL` from `playwright.config.ts` and does not open a browser window.

```typescript
import { test, expect } from '@playwright/test';

test('Exercise 1: GET /api/products returns the product catalogue', async ({ request }) => {
  const response = await request.get('/api/products');

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveProperty('products');
  expect(body.count).toBe(12);
});
```

Run it:

```bash
npx playwright test tests/api-exercises.spec.ts --headed
```

📋 Notice that no browser window opens even with `--headed`. Why? What is the `request` fixture actually doing?

<details>
  <summary>Need some help?</summary>

  The `request` fixture is a pure HTTP client — it sends and receives HTTP requests without launching a browser process. Think of it as a built-in Playwright equivalent of `fetch()` or `curl`. It has access to cookies, headers, and response bodies, but it never renders HTML or runs JavaScript.

  `--headed` only affects tests that use the `page` fixture. Tests using only `request` are always headless by nature — there is no browser to show.

  This matters for performance: an API call in Playwright takes milliseconds. An equivalent action through the UI (navigate, fill form, click, wait for response) takes seconds.

</details>

---

### Exercise 2 — API and UI: Two Views of the Same Data

Your UI and your API describe the same state. If they disagree, something is broken.

```typescript
test('Exercise 2: product name in the API matches the UI', async ({ page, request }) => {
  const response = await request.get('/api/products/1');
  expect(response.status()).toBe(200);
  const { product } = await response.json();

  await page.goto(`/products/1`);

  await expect(page.getByTestId('product-detail-name')).toHaveText(product.name);
  await expect(page.getByTestId('product-detail-price')).toHaveText(`$${product.price.toFixed(2)}`);
});
```

📋 This test uses both `request` and `page`. What happens if the UI is rendering the wrong product? Would a UI-only test catch this?

<details>
  <summary>Need some help?</summary>

  A UI-only test that checks `product-detail-name` would assert the element contains *some* text — but it cannot verify the text is the *correct* text for the product the user requested. If the UI rendered product 2 instead of product 1, a UI-only test using `toBeVisible()` would still pass.

  By asserting `toHaveText(product.name)` where `product.name` comes from the API, the test verifies that the UI and the API agree on the same data. This is cross-layer validation — catching integration bugs that unit tests and isolated UI tests both miss.

</details>

---

### Exercise 3 — Login Bypass: Inject a Cookie Instead of Clicking the Form

Clicking through the login form adds ~3 seconds and a potential failure point to every test that needs authentication. For a suite of 40 tests, that is 2 minutes of avoidable login overhead.

```typescript
test('Exercise 3: access authenticated pages by injecting a session cookie', async ({ page, request }) => {
  const response = await request.post('/api/auth/login', {
    data: { email: 'standard_user@example.com', password: 'Password123!' }
  });
  expect(response.status()).toBe(200);
  const { token } = await response.json();

  await page.context().addCookies([{
    name: 'token', value: token, domain: 'localhost', path: '/'
  }]);

  await page.goto('/orders');
  await expect(page.getByTestId('orders-heading')).toBeVisible();
  await expect(page.getByTestId('nav-logout')).toBeVisible();
});
```

📋 Remove the `addCookies` call and run the test again. What happens to the navigation to `/orders`?

<details>
  <summary>Need some help?</summary>

  Without the cookie, the server receives a request for `/orders` with no authentication token. It redirects to `/login`. The `orders-heading` assertion fails because the page is the login page, not the orders page.

  TestMart authenticates via an `httpOnly` cookie called `token`. By injecting it before navigation, we short-circuit the entire login flow — the server sees an authenticated request from the first `goto()`.

  This technique scales: in `playwright.config.ts`, you can configure a `setup` project that runs once, saves the authenticated state to `tests/.auth/user.json`, and all subsequent tests start already logged in (you built this pattern in Session 3 Example 7).

</details>

---

### Exercise 4 — Create Data via API, Verify in the UI

Seed data should not be shared. Create exactly what the test needs, verify it, then clean it up. This exercise combines API authentication, the cookie injection technique from Exercise 3, and UI verification.

```typescript
test('Exercise 4: API-created product appears in the UI', async ({ page, request }) => {
  // Authenticate as admin
  const loginRes = await request.post('/api/auth/login', {
    data: { email: 'admin@example.com', password: 'Admin123!' }
  });
  expect(loginRes.status()).toBe(200);
  const { token } = await loginRes.json();

  // Create a unique product
  const productName = `Lab-Product-${Date.now()}`;
  const createRes = await request.post('/api/products', {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: productName, description: 'Created by test', price: 42.99, category: 'Electronics', stock: 5 }
  });
  expect(createRes.status()).toBe(201);
  const { product } = await createRes.json();

  // Inject standard user session (same technique as Exercise 3)
  const userLoginRes = await request.post('/api/auth/login', {
    data: { email: 'standard_user@example.com', password: 'Password123!' }
  });
  const { token: userToken } = await userLoginRes.json();
  await page.context().addCookies([{ name: 'token', value: userToken, domain: 'localhost', path: '/' }]);

  // Verify in UI
  await page.goto('/products');
  await page.getByTestId('search-input').fill(productName);
  await page.getByTestId('search-btn').click();
  await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
  await expect(page.getByTestId('product-card')).toHaveCount(1);
  await expect(page.getByTestId('product-name')).toHaveText(productName);

  // Clean up
  await request.delete(`/api/products/${product.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
});
```

📋 The product name includes `Date.now()`. What problem does this solve?

<details>
  <summary>Need some help?</summary>

  `Date.now()` generates a Unix timestamp in milliseconds, making every product name unique per run. Without it, two simultaneous test runs would try to create a product with the same name. Depending on the application's validation rules, the second creation might fail — or both might succeed, causing the count assertion to find 2 results instead of 1.

  In production test suites, `crypto.randomUUID()` or a library like `@faker-js/faker` is preferred, but `Date.now()` is sufficient for lab exercises.

</details>

---

### Exercise 5 — Assert the API After a UI Action

UI assertions confirm what the browser renders. API assertions confirm what the backend actually stored. Together they give full-stack confidence.

```typescript
test('Exercise 5: placing an order via UI creates an order record in the API', async ({ page, request }) => {
  const loginRes = await request.post('/api/auth/login', {
    data: { email: 'standard_user@example.com', password: 'Password123!' }
  });
  const { token } = await loginRes.json();
  await page.context().addCookies([{ name: 'token', value: token, domain: 'localhost', path: '/' }]);

  // Add cart item via API — this is a precondition, not what we are testing
  await request.post('/api/cart', {
    headers: { Cookie: `token=${token}` },
    data: { product_id: 1 }
  });

  await page.goto('/checkout');
  await page.getByTestId('checkout-name').fill('Alex Johnson');
  await page.getByTestId('checkout-address').fill('123 Test Street');
  await page.getByTestId('checkout-city').fill('Sydney');
  await page.getByTestId('checkout-postcode').fill('2000');
  await page.getByTestId('checkout-card').fill('4242 4242 4242 4242');
  await page.getByTestId('checkout-expiry').fill('12/28');
  await page.getByTestId('checkout-cvv').fill('123');
  await page.getByTestId('place-order-btn').click();

  await expect(page.getByTestId('order-confirmation')).toBeVisible();
  const orderId = await page.getByTestId('order-id').textContent();
  const cleanId = orderId?.replace('#', '').trim();

  const orderRes = await request.get(`/api/orders/${cleanId}`, {
    headers: { Cookie: `token=${token}` }
  });
  expect(orderRes.status()).toBe(200);
  const { order } = await orderRes.json();
  expect(order.status).toBe('confirmed');
  expect(order.items).toHaveLength(1);
});
```

📋 The cart item is added via the API rather than through the UI. What principle does this illustrate?

<details>
  <summary>Need some help?</summary>

  The purpose of this test is to verify that the UI checkout form creates the correct backend record. Adding a product to the cart is a **precondition** — it must happen before the test action, but testing "add to cart" is not this test's job.

  By adding the cart item via API, you eliminate a potential failure point (a cart UI bug would fail this test for the wrong reason) and keep the test focused on its actual concern: the checkout form creates the right order record.

  Use the most appropriate layer for each part of the test. UI for what the user sees, API for everything else.

</details>

---

## Part B — Full Hybrid Flow

Now combine POM (from Part A) and API preconditioning into a single clean test. You will build an `ApiClient` class that encapsulates all API operations — the same design principle as your page objects.

**What you are building:**

```
tests/
├── pages/          ← already built (Part A)
├── fixtures/
│   └── test-fixtures.ts   ← extend with 'api' fixture
├── utils/
│   └── api-client.ts      ← new: reusable API methods
└── specs/
    └── hybrid-flow.spec.ts ← new: full hybrid test
```

By the end, your test will:
1. Authenticate via API (no browser login)
2. Create a unique product via API
3. Verify it appears in the UI using `productsPage`
4. Update its price via API
5. Verify the UI reflects the updated price
6. Clean up via `afterEach`

---

### Step 1 — Build the ApiClient

Create `tests/utils/api-client.ts`. The structure is provided — write the method bodies:

```typescript
import { APIRequestContext, expect } from '@playwright/test';

export class ApiClient {
  private adminToken: string | null = null;

  constructor(private request: APIRequestContext) {}

  // POST /api/auth/login with admin credentials
  // Store the returned token in this.adminToken
  async loginAsAdmin(): Promise<void> {
    // TODO
  }

  // POST /api/auth/login with standard user credentials
  // Return the token string (caller injects it as a cookie)
  async loginAsUser(): Promise<string> {
    // TODO
    return '';
  }

  // POST /api/products with admin token — assert status 201
  // Return the created product object
  async createProduct(data: {
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
  }): Promise<{ id: number; name: string; price: number }> {
    // TODO
    return { id: 0, name: '', price: 0 };
  }

  // PATCH /api/products/{id} with admin token — assert status 200
  async updateProduct(id: number, data: Partial<{ price: number; stock: number }>): Promise<{ id: number; price: number }> {
    // TODO
    return { id: 0, price: 0 };
  }

  // DELETE /api/products/{id} with admin token — assert status 204
  async deleteProduct(id: number): Promise<void> {
    // TODO
  }
}
```

📋 Why is `adminToken` stored as an instance variable rather than passed to each method?

<details>
  <summary>Need some help?</summary>

  Storing the token on the instance means callers authenticate once (`await api.loginAsAdmin()`) and all subsequent calls use it transparently. If each method required the token as a parameter, every call site would repeat it:

  ```typescript
  const token = await api.loginAsAdmin();
  await api.createProduct(token, data);
  await api.updateProduct(token, id, update);
  await api.deleteProduct(token, id);
  ```

  This is more repetitive and error-prone. Encapsulating the token in the instance is the same principle as `LoginPage` storing `this.page` — the dependency is provided once and managed internally.

</details>

---

### Step 2 — Add the `api` Fixture

Update `tests/fixtures/test-fixtures.ts` to include the `ApiClient`:

```typescript
import { ApiClient } from '../utils/api-client';

// Add to the Fixtures type:
type Fixtures = {
  loginPage:    LoginPage;
  productsPage: ProductsPage;
  cartPage:     CartPage;
  api:          ApiClient;   // ← add this
};

// Add to base.extend:
api: async ({ request }, use) => {
  await use(new ApiClient(request));
},
```

---

### Step 3 — Write the Hybrid Test

Create `tests/specs/hybrid-flow.spec.ts`. Structure and expected outcomes are provided — write the implementation:

```typescript
import { test, expect } from '../fixtures/test-fixtures';

let productId: number;

test.afterEach(async ({ api }) => {
  if (productId) {
    await api.loginAsAdmin();
    await api.deleteProduct(productId);
    productId = 0;
  }
});

test('create product via API, verify in UI, update price, verify update', async ({ page, api, productsPage }) => {

  // Step 1: Authenticate admin (for product operations) and inject standard user session
  // Expected: admin token stored in api instance; standard user cookie set on page context

  // Step 2: Create a unique product via API
  // Use a name like `Hybrid-Test-${Date.now()}`
  // Store product.id in the outer productId variable for cleanup

  // Step 3: Use productsPage to navigate and search for the created product
  // Expected: exactly 1 result, product name matches

  // Step 4: Update the product price to 99.99 via API

  // Step 5: Reload and search again using productsPage
  // Expected: product price shows $99.99

});
```

Run after completing each step:

```bash
npx playwright test tests/specs/hybrid-flow.spec.ts --headed
```

### Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `401 Unauthorised` on POST /api/products | Admin token not sent | Check `loginAsAdmin()` stores the token and `createProduct()` sends it |
| Search returns 0 results | Standard user not authenticated | Inject the user cookie before `productsPage.goto()` |
| Price still shows old value | Page not reloaded after PATCH | Add `await page.reload()` before searching again |
| `afterEach` fails with 404 | `productId` was 0 — test failed before creation | The `if (productId)` guard prevents this — check it is in place |

<details>
  <summary>🔓 Full solution — only open after 10+ minutes stuck and the troubleshooting table has not helped</summary>

**`tests/utils/api-client.ts`:**
```typescript
import { APIRequestContext, expect } from '@playwright/test';

export class ApiClient {
  private adminToken: string | null = null;

  constructor(private request: APIRequestContext) {}

  async loginAsAdmin(): Promise<void> {
    const res = await this.request.post('/api/auth/login', {
      data: { email: 'admin@example.com', password: 'Admin123!' }
    });
    expect(res.status()).toBe(200);
    this.adminToken = (await res.json()).token;
  }

  async loginAsUser(): Promise<string> {
    const res = await this.request.post('/api/auth/login', {
      data: { email: 'standard_user@example.com', password: 'Password123!' }
    });
    expect(res.status()).toBe(200);
    return (await res.json()).token;
  }

  async createProduct(data: { name: string; description: string; price: number; category: string; stock: number }) {
    const res = await this.request.post('/api/products', {
      headers: { Authorization: `Bearer ${this.adminToken}` },
      data,
    });
    expect(res.status()).toBe(201);
    return (await res.json()).product;
  }

  async updateProduct(id: number, data: Partial<{ price: number; stock: number }>) {
    const res = await this.request.patch(`/api/products/${id}`, {
      headers: { Authorization: `Bearer ${this.adminToken}` },
      data,
    });
    expect(res.status()).toBe(200);
    return (await res.json()).product;
  }

  async deleteProduct(id: number): Promise<void> {
    const res = await this.request.delete(`/api/products/${id}`, {
      headers: { Authorization: `Bearer ${this.adminToken}` },
    });
    expect(res.status()).toBe(204);
  }
}
```

**`tests/fixtures/test-fixtures.ts`:**
```typescript
import { test as base } from '@playwright/test';
import { LoginPage }    from '../pages/login.page';
import { ProductsPage } from '../pages/products.page';
import { CartPage }     from '../pages/cart.page';
import { ApiClient }    from '../utils/api-client';

type Fixtures = {
  loginPage:    LoginPage;
  productsPage: ProductsPage;
  cartPage:     CartPage;
  api:          ApiClient;
};

export const test = base.extend<Fixtures>({
  loginPage:    async ({ page }, use) => { await use(new LoginPage(page)); },
  productsPage: async ({ page }, use) => { await use(new ProductsPage(page)); },
  cartPage:     async ({ page }, use) => { await use(new CartPage(page)); },
  api:          async ({ request }, use) => { await use(new ApiClient(request)); },
});

export { expect } from '@playwright/test';
```

**`tests/specs/hybrid-flow.spec.ts`:**
```typescript
import { test, expect } from '../fixtures/test-fixtures';

let productId: number;

test.afterEach(async ({ api }) => {
  if (productId) {
    await api.loginAsAdmin();
    await api.deleteProduct(productId);
    productId = 0;
  }
});

test('create product via API, verify in UI, update price, verify update', async ({ page, api, productsPage }) => {
  await api.loginAsAdmin();
  const userToken = await api.loginAsUser();
  await page.context().addCookies([{ name: 'token', value: userToken, domain: 'localhost', path: '/' }]);

  const name = `Hybrid-Test-${Date.now()}`;
  const product = await api.createProduct({
    name, description: 'Created by hybrid test', price: 29.99, category: 'Electronics', stock: 10,
  });
  productId = product.id;

  await productsPage.goto();
  await productsPage.search(name);
  await expect(productsPage.productCards).toHaveCount(1);
  await expect(productsPage.productNames).toHaveText(name);

  await api.updateProduct(productId, { price: 99.99 });

  await page.reload();
  await productsPage.search(name);
  await expect(page.getByTestId('product-price')).toHaveText('$99.99');
});
```

</details>

---

## Acceptance Criteria

- [ ] All 3 Part A POM tests pass on a clean run
- [ ] All 5 Part B exercises pass
- [ ] The hybrid-flow test passes on 3 consecutive runs
- [ ] No product data is left after the hybrid-flow test — `afterEach` cleans up reliably
- [ ] You can explain: why `errorMessage` in `LoginPage` is a getter returning a `Locator` rather than a method returning `Promise<string>`
- [ ] You can explain: why `protected` is used for `page` in `BasePage` instead of `private`
- [ ] The `ApiClient` uses the admin token from `loginAsAdmin()` — no raw `Authorization` headers in the test body
- [ ] You can explain: what would happen if two participants ran the hybrid-flow test simultaneously without the unique name suffix

---

## Key Playwright APIs Used in This Lab

| API | What It Does |
|-----|-------------|
| `base.extend<Fixtures>({ ... })` | Creates a custom `test` object with additional fixtures |
| `async ({ page }, use) => { await use(...) }` | Fixture factory function — creates a fixture instance and passes it to the test |
| `request.get(url)` | Send a GET request; returns a `Response` object |
| `request.post(url, { data })` | Send a POST request with a JSON body |
| `request.patch(url, { data })` | Send a PATCH request with a JSON body |
| `request.delete(url)` | Send a DELETE request |
| `response.status()` | Return the HTTP status code |
| `response.json()` | Parse and return the response body as an object |
| `page.context().addCookies([...])` | Inject cookies into the current browser context |
| `page.reload()` | Reload the current page |
| `expect(value).toBe(n)` | Assert exact equality |
| `expect(value).toHaveProperty(key)` | Assert an object has a given key |
| `expect(value).toHaveLength(n)` | Assert an array has exactly n items |

---

## Lab

You have built page objects for login, products, and cart, and combined them with API preconditioning in the hybrid flow. Now apply both patterns together, independently.

Using your existing `LoginPage`, `ProductsPage`, `CartPage`, and `ApiClient`, write a standalone test in `tests/full-hybrid.spec.ts` that:

- Creates a unique product via API (Electronics category, price $49.99, stock 5)
- Authenticates as the standard user via API and injects the session cookie
- Adds the product to the cart via the API (not the UI)
- Navigates to `/cart` using `CartPage` and verifies the item is present
- Completes checkout through the UI, filling all required form fields
- Asserts the order confirmation page shows an order ID
- Calls `GET /api/orders/{orderId}` to verify the backend recorded the order with `status: 'confirmed'` and exactly 1 item
- Cleans up the created product in `afterEach`

The cart item must be added via API. The checkout form must be submitted via the UI. Use your page objects wherever applicable. No `waitForTimeout` calls anywhere.

> Stuck? Try the [hints](hints.md) or check the [solution](solution.md).

---

*Proceed to **Session 5 — BDD, Full API Automation & Mocking** once all acceptance criteria are met.*
