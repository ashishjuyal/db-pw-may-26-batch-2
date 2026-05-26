# Session 6 — Hybrid Testing

## Hybrid Testing: API + UI

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

### Example — API Schema Validation with ajv

**What this covers:** asserting that the shape and types of an API response are correct, not just the values.

**Why this matters:** asserting `response.data.products[0].price === 149.99` tells you one product has the right price. It does not tell you that `price` is always a `number` — if a backend change accidentally returns `"149.99"` (a string), your price display breaks silently. Schema validation catches the type change before it reaches production.

**Install ajv:**

```bash
npm install --save-dev ajv
```

Create `tests/api/product-schema.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import Ajv from 'ajv';

const ajv = new Ajv();

const productSchema = {
  type: 'object',
  required: ['id', 'name', 'price', 'category', 'stock'],
  properties: {
    id:          { type: 'integer' },
    name:        { type: 'string' },
    description: { type: 'string' },
    price:       { type: 'number', minimum: 0 },
    category:    { type: 'string', enum: ['Electronics', 'Accessories', 'Software'] },
    stock:       { type: 'integer', minimum: 0 },
    image_url:   { type: 'string' },
  },
  additionalProperties: false,
};

const responseSchema = {
  type: 'object',
  required: ['products', 'count'],
  properties: {
    products: {
      type: 'array',
      items: productSchema,
    },
    count: { type: 'integer', minimum: 0 },
  },
  additionalProperties: false,
};

test('GET /api/products response matches schema', async ({ request }) => {
  const response = await request.get('/api/products');
  expect(response.status()).toBe(200);

  const body = await response.json();

  const validate = ajv.compile(responseSchema);
  const valid = validate(body);

  if (!valid) {
    console.error('Schema validation errors:', validate.errors);
  }
  expect(valid, `Schema errors: ${JSON.stringify(validate.errors)}`).toBe(true);
});

test('GET /api/products/:id response matches schema', async ({ request }) => {
  const singleProductSchema = {
    type: 'object',
    required: ['product'],
    properties: {
      product: productSchema,
    },
    additionalProperties: false,
  };

  const response = await request.get('/api/products/1');
  expect(response.status()).toBe(200);

  const body = await response.json();
  const validate = ajv.compile(singleProductSchema);
  const valid = validate(body);

  if (!valid) console.error('Schema errors:', validate.errors);
  expect(valid).toBe(true);
});
```

Run the schema tests:

```bash
npx playwright test tests/api/product-schema.spec.ts
```

📋 The `productSchema` includes `additionalProperties: false`. What does this protect against, and can you think of a scenario where removing it would cause a schema test to pass but a production bug to go undetected?

<details>
<summary>Need some help?</summary>

`additionalProperties: false` rejects any response object that contains fields not listed in `properties`. Without it, the schema matches any object that has the required fields — even one that also includes an `internal_cost` field that the backend developer forgot to strip before returning the response.

Example scenario: the backend accidentally serialises a `password_hash` column alongside product data. Without `additionalProperties: false`, the schema passes. With it, the test fails immediately, catching the data leak before it reaches a browser.

</details>

**Verify:**
- [ ] Both schema tests pass: `npx playwright test tests/api/product-schema.spec.ts`
- [ ] You can explain what `additionalProperties: false` protects against
- [ ] You can identify which field in the product schema would catch a `price: "89.99"` (string) regression

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

