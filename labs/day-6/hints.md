# Lab Hints — Session 4 Hybrid Testing

## Creating the product

Use `ApiClient.createProduct()` with a unique name (`Date.now()`). Store the returned `product.id` in the outer `productId` variable so `afterEach` can clean it up. Use Electronics category, price $49.99, stock 5.

## Authentication

Call `api.loginAsAdmin()` to store the admin token (needed for product creation). Call `api.loginAsUser()` to get the standard user token, then inject it with `page.context().addCookies()` before any navigation.

## Adding to the cart via API

Use `request.post('/api/cart', { data: { product_id: productId } })` with the standard user token in the `Cookie` header: `Cookie: token=${userToken}`. Check `testmart/README.md` for the exact cart API endpoint and request format.

## Verifying the cart in the UI

Use `CartPage.goto()` to navigate to `/cart`, then assert `cartPage.cartItems` has the expected count. You built `CartPage` in Part A — use it here.

## The checkout form

All required fields have `data-testid` attributes — refer to `testmart/README.md` for the full list. Use `fill()` for text inputs. After clicking `place-order-btn`, wait for `order-confirmation` to be visible before reading the order ID.

## Extracting the order ID

The order ID is displayed in `data-testid="order-id"` and includes a `#` prefix (e.g. `#5`). Use `textContent()` to read it, then strip the `#` and whitespace before passing it to the API call.

## Verifying via the API

The order detail endpoint is `GET /api/orders/{id}` and requires the user token in the `Cookie` header. The response body has an `order` property with `status` and `items` fields.

## Cleanup

Use the `if (productId)` guard in `afterEach` — only delete if creation succeeded.

> Need more? Here's the [solution](solution.md).

---

> Back to the [lab](README.md).
