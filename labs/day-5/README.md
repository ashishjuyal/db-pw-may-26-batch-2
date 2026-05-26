# Session 5 — Playwright Project Configuration & POM

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

- Session lab completed — `tests/advanced.spec.ts` passes
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

All 3 tests must pass before continuing.
