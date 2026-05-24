# Lab Hints — Session 2 Playwright Core

## Filtering by category

The category filter buttons are on the Products page. Check `testmart.md` for their `data-testid` values — they follow the pattern `filter-<category.toLowerCase()>`. After clicking a filter, the product grid re-renders asynchronously. Wait for the loading spinner to disappear before asserting on the results.

## Asserting only Electronics products appear

After filtering, each product card has a `data-testid="product-category"` element. You can assert that every visible category label shows "Electronics" using `expect(locator).toHaveText()` — but note there will be multiple matching elements. Look at the Playwright docs for `locator.all()` or consider asserting on the count and spot-checking one card.

## Navigating to a product detail page

Each product card contains a link with `data-testid="product-link"`. Clicking the first one will take you to `/products/:id`. The detail page has individual testids for name, price, and the stock badges — refer to `testmart.md`.

## The unauthenticated add-to-cart redirect

The Add to Cart button has `data-require-auth="true"` on it when the user is not logged in. Clicking it triggers a JavaScript redirect to `/login?next=/products`. You can assert this with `expect(page).toHaveURL(/login/)` after the click.

## Asserting the redirect after login

After a successful login the app redirects to the `next` query parameter value. Use `toHaveURL` to confirm you end up back on a products-related URL, not the login page.

> Need more? Here's the [solution](solution.md).

---

> Back to the [lab](README.md).
