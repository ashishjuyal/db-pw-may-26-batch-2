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

*Proceed to **Session 4 — Advanced Interactions** once all acceptance criteria are met.*