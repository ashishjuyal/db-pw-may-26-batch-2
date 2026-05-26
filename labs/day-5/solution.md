# Lab Solution — Session 4 Hybrid Testing

## Complete test

**`tests/full-hybrid.spec.ts`:**

```typescript
import { test, expect } from './fixtures/test-fixtures';

let productId: number;
let userToken: string;

test.afterEach(async ({ api }) => {
  if (productId) {
    await api.loginAsAdmin();
    await api.deleteProduct(productId);
    productId = 0;
  }
});

test('full checkout flow using POM and API preconditioning', async ({ page, api, request, cartPage }) => {

  // Step 1: Create a unique product via API
  await api.loginAsAdmin();
  const productName = `Checkout-Test-${Date.now()}`;
  const product = await api.createProduct({
    name: productName,
    description: 'Created for checkout lab exercise',
    price: 49.99,
    category: 'Electronics',
    stock: 5,
  });
  productId = product.id;

  // Step 2: Authenticate as standard user and inject session cookie
  userToken = await api.loginAsUser();
  await page.context().addCookies([{
    name: 'token', value: userToken, domain: 'localhost', path: '/'
  }]);

  // Step 3: Add the product to the cart via API (not the UI)
  const cartRes = await request.post('/api/cart', {
    headers: { Cookie: `token=${userToken}` },
    data: { product_id: productId }
  });
  expect(cartRes.status()).toBe(201);

  // Step 4: Verify the cart contains the item using CartPage
  await cartPage.goto();
  await expect(cartPage.cartItems).toHaveCount(1);

  // Step 5: Proceed to checkout using CartPage
  await cartPage.checkout();

  // Step 6: Fill the checkout form through the UI
  await page.getByTestId('checkout-name').fill('Alex Johnson');
  await page.getByTestId('checkout-address').fill('123 Test Street');
  await page.getByTestId('checkout-city').fill('Sydney');
  await page.getByTestId('checkout-postcode').fill('2000');
  await page.getByTestId('checkout-card').fill('4242 4242 4242 4242');
  await page.getByTestId('checkout-expiry').fill('12/28');
  await page.getByTestId('checkout-cvv').fill('123');
  await page.getByTestId('place-order-btn').click();

  // Step 7: Assert the confirmation UI
  await expect(page.getByTestId('order-confirmation')).toBeVisible();
  const orderIdText = await page.getByTestId('order-id').textContent();
  const orderId = orderIdText?.replace('#', '').trim();
  expect(orderId).toBeTruthy();

  // Step 8: Verify the backend recorded the order correctly
  const orderRes = await request.get(`/api/orders/${orderId}`, {
    headers: { Cookie: `token=${userToken}` }
  });
  expect(orderRes.status()).toBe(200);
  const { order } = await orderRes.json();
  expect(order.status).toBe('confirmed');
  expect(order.items).toHaveLength(1);
  expect(order.items[0].price).toBe(49.99);
});
```

## Key decisions explained

**Why the cart is added via API, not UI:** The test's purpose is to verify the checkout flow, not the "add to cart" flow. Adding via API keeps the test focused — if the cart UI breaks, this test should not fail for that reason.

**Why `CartPage` is used for cart navigation:** The Lab task asks you to verify the cart contains the item before proceeding. Using `cartPage.goto()` and `cartPage.cartItems` is consistent with the POM patterns built in Part A. You could use `page.goto('/cart')` directly but that bypasses the abstraction layer you just built.

**Why `userToken` is stored in an outer variable:** The `afterEach` hook only receives the `api` fixture — it cannot access variables declared inside the test. `productId` is stored the same way. Both are reset after cleanup to prevent values leaking into subsequent test runs.

**Why `Cookie: token=${userToken}` and not `Authorization: Bearer`:** TestMart's cart and order APIs check for the JWT in the `token` cookie, which is how the browser sends it after login. Admin operations use `Authorization: Bearer` — that is why `ApiClient` uses the bearer header for admin calls but the cookie for user-level calls.

**The `orderId` extraction:** `page.getByTestId('order-id').textContent()` returns `'#5'` — the `#` is part of the rendered label. Stripping it with `.replace('#', '')` gives the raw numeric ID needed for the API call. `toBeTruthy()` confirms the ID was actually extracted before using it in the API request.

---

> Back to the [lab](README.md).
