# Session 4 — Advanced Interactions

> **Lab: Advanced Playwright Patterns**
> Go beyond basic assertions — handle dialogs, monitor the browser console, manage cookies, automate file downloads and uploads, and control test execution with skip, fail, and fixme annotations.

---

## Lab at a Glance

```
Part A        → 7 focused examples — one concept each
  Example 1   → Dialogs — default dismiss, accept, handle once
  Example 2   → Console monitoring and soft assertions
  Example 3   → Cookies — read, write, clear
  Example 4   → Download and upload
  Example 5   → Skip, fixme, and fail annotations
  Example 6   → test.describe and beforeEach — group tests and share setup
Lab           → Independent: combine all techniques without guidance
```

> **TestMart** must be running: `cd testmart && npm start`

---

## Prerequisites

- Session 3 lab completed — `tests/login-flow.spec.ts` exists and passes
- TestMart running on `http://localhost:3000`

---

## Part A — Advanced Interaction Examples

Add each example to a new file `tests/advanced.spec.ts` unless instructed otherwise.

---

### Example 1 — Dialogs

Dialogs are native browser popups — `alert`, `confirm`, and `prompt`. They block the browser until the user responds. Playwright has a clear, built-in model for handling them.

The TestMart `/advanced-scenarios` page has a form with a "First name" field and a "Clear" button. When you click Clear, the browser fires a `confirm` dialog asking whether you really want to clear the field. Depending on how you respond, the field is either cleared (OK) or left unchanged (Cancel/dismiss).

**What makes dialogs tricky without Playwright's help:**
A dialog that appears during a test will block the browser and your test will hang until the dialog timeout kicks in. Playwright's default behaviour is to auto-dismiss every dialog — but it is silent about doing so. Your test continues, but the action that triggered the dialog has no effect. This is easy to mistake for a bug in your test rather than an unhandled dialog.

The three tests below demonstrate all three scenarios:

```typescript
import { expect, test } from '@playwright/test';

const name = 'Playwright';

// Test 1 — Default Playwright behaviour: dialogs are auto-dismissed
// Because the dialog is dismissed, clicking Clear has no effect on the input.
// The field still contains 'Playwright' after clicking Clear.
// This is the "silent" default — useful to know when a test behaves unexpectedly
// after an action that triggers a dialog.
test('dialog: default handling is to dismiss', async ({ page }) => {
  await page.goto('/advanced-scenarios');

  const input = page.getByLabel('First name');
  await input.fill(name);
  await expect(input).toHaveValue(name);

  await page.getByRole('button', { name: 'Clear' }).click();

  // The field is still 'Playwright' — the dialog was dismissed, so Clear did nothing
  await expect(input).toHaveValue(name);
});

// Test 2 — Accept every dialog for the lifetime of the page
// page.on() registers a permanent listener. Every dialog that appears
// on this page will be accepted until the test ends.
// After accepting, the Clear button works as intended — the field is emptied.
test('dialog: accept all dialogs on this page', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());

  await page.goto('/advanced-scenarios');

  const input = page.getByLabel('First name');
  await input.fill(name);
  await expect(input).toHaveValue(name);

  await page.getByRole('button', { name: 'Clear' }).click();

  // The dialog was accepted — the field is now empty
  await expect(input).toHaveValue('');
});

// Test 3 — Accept only the NEXT dialog, then revert to default (dismiss)
// page.once() registers a one-time listener. The first dialog is accepted.
// Any subsequent dialog falls back to the default dismiss behaviour.
// This is useful when a flow has multiple dialogs and you need fine-grained control.
test('dialog: accept once, then dismiss subsequent dialogs', async ({ page }) => {
  page.once('dialog', dialog => dialog.accept());

  await page.goto('/advanced-scenarios');

  const input = page.getByLabel('First name');
  await input.fill(name);
  await expect(input).toHaveValue(name);

  // First click — the one-time listener fires, dialog is accepted, field clears
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(input).toHaveValue('');

  // Fill the field again
  await input.fill(name);

  // Second click — no listener registered, Playwright auto-dismisses, field unchanged
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(input).toHaveValue(name);
});
```

📋 In Test 2, the `page.on('dialog', ...)` line appears **before** `page.goto(...)`. Why does the order matter? What would happen if you registered the listener after navigating?

<details>
  <summary>Need some help?</summary>

  Dialogs can fire immediately — sometimes during or right after navigation, before your next line of test code runs. If you register the listener after `page.goto()`, there is a window where a dialog could appear and be handled by Playwright's default (dismiss) before your listener is attached.

  The safe pattern is to register all `page.on()` listeners before navigation. This guarantees the listener is in place for every dialog the page might fire from the moment it loads.

  The rule applies to all browser events you listen to with `page.on()`: `dialog`, `console`, `pageerror`, `download`, `request`, `response`. Register before navigation.

</details>

---

### Example 2 — Console Monitoring and Soft Assertions

The browser console is a live signal from your application. Unexpected errors in the console often indicate broken features — a failed API call, an unhandled exception, or a missing resource — that your UI tests might otherwise miss because the page visually appears fine.

Playwright gives you two distinct ways to listen for browser-side problems:

- **`page.on('console', msg => ...)`** — fires for every `console.log`, `console.warn`, `console.error` call inside the page. The `msg.type()` tells you which level it is.
- **`page.on('pageerror', msg => ...)`** — fires for uncaught JavaScript exceptions thrown by the page (not `console.error` — a real thrown `Error`). This is the difference between `console.error('something')` and `throw new Error('something')`.

**Soft assertions** (`expect.soft`) come in here naturally: you want to check multiple console events without stopping the test at the first one. A page might emit several console warnings — you want to see all of them in a single test run rather than fixing one and re-running to find the next.

```typescript
import { test, expect } from '@playwright/test';

// Register listeners BEFORE navigation (see Example 1 — same reason)
test('console: no errors or uncaught exceptions on page interaction', async ({ page }) => {

  // Listen to all browser console output
  // msg.type() returns: 'log', 'info', 'warning', 'error'
  // 'error' means the page called console.error() — not a thrown exception
  page.on('console', msg => {
    // expect.soft continues running even if this assertion fails
    // All violations are collected and reported together at the end of the test
    expect.soft(msg.type()).not.toEqual('error');
  });

  // Listen to uncaught JavaScript exceptions
  // msg.name returns the exception class name, e.g. 'Error', 'TypeError', 'ReferenceError'
  // This fires when the page throws an unhandled error — NOT when console.error() is called
  // Note: 'error' (lowercase) is a console message type; 'Error' (uppercase) is an exception class
  page.on('pageerror', msg => {
    expect.soft(msg.name).not.toEqual('Error');
  });

  await page.goto('/advanced-scenarios');

  // Trigger a user action — if Register has any broken event handler, errors will surface here
  await page.getByRole('button', { name: 'Register' }).click();

  // All soft assertion failures collected above are reported here, at the end of the test
  // The test is marked failed if any soft assertion failed, but every assertion ran
});
```

📋 Replace one of the `expect.soft(...)` calls with a regular `expect(...)` and deliberately trigger a console error (ask your instructor how to simulate one, or introduce a broken script tag on the page). What changes in the test output when using `expect` vs `expect.soft`?

<details>
  <summary>Need some help?</summary>

  With regular `expect`: the test stops at the first failed assertion. If the first console listener fires and fails, the second listener's assertions never execute.

  With `expect.soft`: all listeners run regardless of whether earlier ones failed. Every violation is collected. The test is marked as failed at the end, but you see the full picture in one run.

  **When to use `expect.soft` for console monitoring:**
  A page interaction might trigger multiple console errors — a failed API call logs one error, and the failed state of the component logs another. With regular `expect`, you'd only see the first. With `expect.soft`, you see all of them and can decide if they are related or independent failures.

  **When NOT to use `expect.soft`:**
  If a later step in the test depends on an earlier step succeeding (e.g., you must be logged in before you can search), use regular `expect`. A failed login with a soft assertion would let the test continue into the search step, producing confusing errors far from the real cause.

</details>

---

### Example 3 — Cookies

Cookies are how web applications persist session state between requests. Understanding how to read, write, and clear cookies in Playwright is essential for tests that bypass login, set up pre-conditions, or verify that authentication state is handled correctly.

Every `BrowserContext` in Playwright has its own isolated cookie jar. You interact with it through `page.context()`.

```typescript
import { expect, test } from '@playwright/test';

test('cookies: read, write, and clear', async ({ page }) => {
  await page.goto('/advanced-scenarios');

  // Read all cookies currently set for this context
  // At this point there will likely be a session cookie from TestMart
  const initialCookies = await page.context().cookies();
  console.log('Cookies after navigation:', initialCookies);

  // Add a cookie to the context
  // The 'url' field determines which domain the cookie belongs to
  // Cookies are scoped by domain — a cookie for playwright.dev will not
  // be sent to requests going to localhost:3000
  await page.context().addCookies([
    { name: 'my-test-cookie', value: 'abc123', url: 'http://localhost:3000' }
  ]);

  const cookiesAfterAdd = await page.context().cookies();
  console.log('Cookies after adding:', cookiesAfterAdd);

  // Clear all cookies from this context
  // This is equivalent to logging out from a session perspective
  await page.context().clearCookies();

  const cookiesAfterClear = await page.context().cookies();
  console.log('Cookies after clearing:', cookiesAfterClear);

  // After clearCookies(), the context has no cookies at all
  expect(cookiesAfterClear).toHaveLength(0);
});
```

📋 `page.context().addCookies()` takes a `url` field, not a `domain` field. What is the practical difference — and what happens if you set `url` to `https://playwright.dev` and then check `page.context().cookies()` while on `http://localhost:3000`?

<details>
  <summary>Need some help?</summary>

  `page.context().cookies()` without arguments returns cookies for the **current page's URL** by default. If you add a cookie for `https://playwright.dev`, it will not appear when the page is at `http://localhost:3000` — because the cookie is scoped to a different domain.

  To see all cookies across all domains in the context, call `page.context().cookies()` after adding them — it returns all cookies regardless of the current URL.

  The practical implication: if you want a cookie to be sent with requests to `localhost:3000` (e.g. a session token), set `url: 'http://localhost:3000'`. Getting the URL wrong means the cookie is technically there but is never sent to your application — and your tests behave as if it was never set.

</details>

---

### Example 4 — File Download and Upload

File operations are a common automation challenge. Playwright handles both download and upload through dedicated APIs that work independently of the browser's native file picker — no OS-level dialog interaction needed.

#### Downloads

Playwright captures a download by waiting for the `download` event before triggering the action that causes it. The important detail: the promise must be set up **before** the click, not after — otherwise the download event fires and is missed.

There are two kinds of downloadable content:

1. **Non-previewable files** (zip, exe, binary): the browser automatically triggers a download. The `download` event fires reliably.
2. **Previewable files** (pdf, image, html): by default, the browser opens them in a new tab rather than downloading. The `download` event never fires. You need to force the browser to treat the file as an attachment.

```typescript
import { test, expect } from '@playwright/test';
import fs from 'fs';

// Download 1 — A .zip file (non-previewable)
// The browser always treats zip files as attachments, so the download event fires naturally.
test('download: zip file triggers download event automatically', async ({ page }) => {
  await page.goto('/savings');

  // Set up the download listener BEFORE clicking — the event fires on click
  const downloadPromise = page.waitForEvent('download');

  await page.getByTestId('download-zip').click();

  // Await the promise — this resolves when the download starts
  const download = await downloadPromise;

  // failure() returns null if the download succeeded, or an error string if it failed
  expect(await download.failure()).toBeNull();
});

// Download 2 — A previewable file (PDF, image, etc.)
// The browser tries to render it inline rather than download it.
// Without intervention, the download event never fires and the test hangs.
//
// Why this happens: the server sends the file without a Content-Disposition: attachment header.
// The browser sees a previewable content type and opens it instead of saving it.
//
// Two fixes are available:
// Option A — Mutate the DOM: add the HTML5 'download' attribute to the link element before clicking.
//            This tells the browser "treat this link as a download, not a navigation."
// Option B — Alt+click: simulates holding Alt while clicking, which forces a Save As in most browsers.
test('download: previewable file — force download with Alt+click', async ({ page }) => {
  await page.goto('/savings');

  const downloadPromise = page.waitForEvent('download');

  // Option A (commented out): inject the 'download' attribute via JavaScript evaluation
  // const downloadLink = page.getByTestId('download');
  // await downloadLink.evaluate((el) => el.setAttribute('download', ''));
  // await downloadLink.click();

  // Option B: Alt+click forces the browser to save rather than preview
  await page.getByTestId('download').click({ modifiers: ['Alt'] });

  const download = await downloadPromise;
  expect(await download.failure()).toBeNull();

  // Verify the file actually landed on disk
  const filePath = await download.path();
  expect(fs.existsSync(filePath)).toBeTruthy();

  // Verify the file has content (not an empty shell)
  const fileSize = fs.statSync(filePath).size;
  expect(fileSize).toBeLessThan(20_000); // sanity-check the size is reasonable
});
```

#### Uploads

File upload inputs (`<input type="file">`) cannot be clicked to open the OS file picker in Playwright — browser security prevents automation from accessing the native dialog. Instead, Playwright provides `setInputFiles()`, which directly sets the file path on the input element without needing to open any dialog.

```typescript
test('upload: set a file on a file input', async ({ page }) => {
  await page.goto('/loans');

  const uploadInput = page.locator('input[type="file"]');

  // Set a single file — path is relative to the project root
  await uploadInput.setInputFiles('./package.json');

  // To set multiple files at once:
  // await uploadInput.setInputFiles(['./package.json', './tsconfig.json']);

  // To clear a previously set file (reset the input):
  await uploadInput.setInputFiles([]);

  // After clearing, the input has no file selected
  // In a real test you would then setInputFiles() with your actual test file
  // and click the submit button to trigger the upload
});
```

📋 In the zip download test, the `downloadPromise` is set up before `click()`. What would happen if you swapped the order — clicking first, then setting up the promise? Try it and observe the result.

<details>
  <summary>Need some help?</summary>

  If you click first and then call `page.waitForEvent('download')`, the download event has already fired and been discarded. The `waitForEvent` call will then wait indefinitely for a download event that will never come again, and the test will timeout.

  This is the same pattern as dialog handling: **always register event listeners before triggering the action that causes the event**. The promise or listener must be in place before the browser has any chance to fire the event.

  A common pattern:
  ```typescript
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('download-zip').click(),
  ]);
  ```
  `Promise.all` starts both concurrently — the listener is set up at the same instant as the click, so no event is missed regardless of timing.

</details>

---

### Example 5 — Skip, Fixme, and Fail Annotations

Not all tests should run all the time. Playwright provides three annotations for controlling test execution when a test is conditionally irrelevant, knowingly broken, or expected to fail.

```typescript
import { expect, test } from '@playwright/test';

// test.skip() at the file level — skips every test in this file
// Uncomment the line below to try it — all tests below will be skipped
// test.skip();

// Unconditional skip — this test never runs
// Use this temporarily when a test is under construction
// The test appears in the report as "skipped" — it does not silently disappear
test.skip('test under construction — will not run', async ({ page }) => {
  console.log('This line is never reached');
});

// Conditional skip — skips based on a runtime condition
// The condition is evaluated when the test starts, not when the file is loaded
// Common use: browser-specific behaviour, feature flags, environment checks
test('skip conditionally based on browser or environment', async ({ page, browserName }) => {
  // Skip this test on Chromium with a reason and a ticket reference
  test.skip(browserName === 'chromium', 'Known issue on Chromium — see ticket ABC-123');

  // Skip based on page state — useful when the feature under test is not present
  // on all environments (e.g. a new feature behind a flag)
  test.skip(
    await page.getByTestId('someFeatureFlag').count() === 0,
    'Skipping — the feature is not enabled in this environment'
  );
});

// test.fixme() — marks a test as known-broken
// It behaves like test.skip() but carries a stronger semantic: this test is broken
// and should be fixed. It shows up differently in the report to draw attention.
// Use this to acknowledge technical debt without hiding the failure.
test.fixme('broken functionality — marked for fix', async ({ page }) => {
  // This body never runs — fixme behaves like a documented skip
});

// test.fail() — documents a test that is EXPECTED to fail
// The test runs in full. If it fails, Playwright marks it as PASSED (expected failure).
// If it unexpectedly passes, Playwright marks it as FAILED (unexpected success).
// Use this to track known bugs: the test documents the broken behaviour and will alert
// you the moment the bug is fixed so you can remove the annotation.
test('document a known broken assertion with test.fail()', async ({ page }) => {
  test.fail(); // Declare this test is expected to fail

  // This assertion is deliberately wrong — 2 does not equal 3
  // With test.fail(), this failure is expected and the test is reported as PASSED
  // The moment someone fixes the underlying bug and this assertion becomes true,
  // Playwright will report it as a failure (unexpected pass) — prompting you to remove test.fail()
  expect(2).toEqual(3);
});
```

📋 What is the difference between `test.skip()` and `test.fixme()` in terms of how they appear in the HTML report and what they communicate to the team?

<details>
  <summary>Need some help?</summary>

  Both `test.skip()` and `test.fixme()` prevent the test body from running. The difference is **intent and visibility**:

  - `test.skip()` says: "this test is not relevant right now." The report shows it as skipped. No one is alarmed.
  - `test.fixme()` says: "this test is broken and needs to be fixed." Some CI setups treat fixme tests differently — they may still show in a dedicated section or trigger a warning. The name itself communicates urgency to the team reviewing the report.

  `test.fail()` is different again — the test body **does run**. It is used to document a known broken assertion. The value is that the moment the underlying bug is fixed and the assertion passes, Playwright reports it as an **unexpected pass**, prompting you to remove the annotation. Without `test.fail()`, you might fix the bug but never notice that the test documenting the broken behaviour is now passing when it shouldn't.

</details>

---

### Example 6 — test.describe and beforeEach: Group Tests and Share Setup

#### What is test.describe?

`test.describe` is a named container for a group of related tests. It does two things:

1. **Organises the HTML report** — tests inside a describe block appear nested under the block's name in the report, making it easy to see which feature or page a test belongs to.
2. **Scopes lifecycle hooks** — `beforeEach`, `afterEach`, `beforeAll`, and `afterAll` declared inside a describe block run only for tests within that block. Hooks in one describe block do not bleed into another.

Without `test.describe`, every `beforeEach` at the top level runs before every test in the entire file. As a file grows, this becomes a problem: you cannot have different setup per group of tests, and the report shows a flat, unorganised list.

**What problem does it solve?**

Look at these two tests — they share identical setup:

```typescript
test('search for Keyboard', async ({ page }) => {
  await page.goto('/products');    // same first line every time
  // ... test body
});

test('filter by Electronics', async ({ page }) => {
  await page.goto('/products');    // same first line every time
  // ... test body
});
```

If you add a third, fourth, or fifth test for the products page, each one repeats `await page.goto('/products')`. If the URL ever changes, you fix it in every test individually.

**The describe + beforeEach pattern:**

```typescript
test.describe('Products page', () => {
  // Runs once before EACH test inside this describe block only
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('search for Keyboard', async ({ page }) => {
    // Starts already on /products — no navigation needed here
  });

  test('filter by Electronics', async ({ page }) => {
    // Also starts on /products — beforeEach ran again for this test
  });
});
```

The URL is now declared once. Every test in the block starts in a known, consistent state. Add a new test and it inherits the setup automatically.

**Lifecycle hooks available inside test.describe:**

| Hook | When it runs |
|------|-------------|
| `test.beforeEach` | Before every test in this block |
| `test.afterEach` | After every test in this block — even if the test failed |
| `test.beforeAll` | Once before the first test in this block |
| `test.afterAll` | Once after the last test in this block |

`beforeEach` and `afterEach` are the ones you will use most. `beforeAll` and `afterAll` are useful for expensive one-time setup (e.g. seeding a database) where repeating it before every test would be too slow.

---

**Your turn.** Create `tests/hooks.spec.ts` with the two flat tests below, then refactor them into a `test.describe` block with a shared `beforeEach`:

```typescript
import { test, expect } from '@playwright/test';

test('search for Keyboard', async ({ page }) => {
  await page.goto('/products');
  await page.getByTestId('search-input').fill('Keyboard');
  await page.getByTestId('search-btn').click();
  await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
  await expect(page.getByTestId('product-card')).toHaveCount(1);
});

test('filter by Electronics', async ({ page }) => {
  await page.goto('/products');
  await page.getByTestId('filter-electronics').click();
  await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
  await expect(page.getByTestId('product-card')).toHaveCount(4);
});
```

Both tests must still pass after the refactor. Run the report and observe how the test names appear differently when they are inside a describe block vs flat at the top level.

<details>
  <summary>Need some help?</summary>

  ```typescript
  import { test, expect } from '@playwright/test';

  test.describe('Products page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/products');
    });

    test('search for Keyboard', async ({ page }) => {
      await page.getByTestId('search-input').fill('Keyboard');
      await page.getByTestId('search-btn').click();
      await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
      await expect(page.getByTestId('product-card')).toHaveCount(1);
    });

    test('filter by Electronics', async ({ page }) => {
      await page.getByTestId('filter-electronics').click();
      await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
      await expect(page.getByTestId('product-card')).toHaveCount(4);
    });
  });
  ```

  Open the HTML report (`npx playwright show-report`) after running. You will see the tests listed as `Products page > search for Keyboard` and `Products page > filter by Electronics` — grouped under their describe name, not as flat entries. This is the difference `test.describe` makes to report readability as a suite grows.

</details>

---

## Part A — Checkpoint

Run all tests before continuing:

```bash
npx playwright test
```

All examples and exercises must pass. If the skip/fail/fixme tests appear unexpectedly: `test.skip` and `test.fixme` will show as skipped; `test.fail` will show as passed (expected failure).

---

## Acceptance Criteria

- [ ] All Part A examples pass on a clean run
- [ ] Dialog tests demonstrate all three handler patterns: none (dismiss), `on` (always), `once` (single)
- [ ] Console test uses both `page.on('console', ...)` and `page.on('pageerror', ...)` with `expect.soft`
- [ ] You can explain to a partner: the difference between a `console.error()` call and a thrown `Error` — and why Playwright uses two separate events for them
- [ ] Download test sets up the `waitForEvent` promise before clicking — you can explain why the order matters
- [ ] You can explain the difference between `test.skip()`, `test.fixme()`, and `test.fail()` and when to use each

---

## Key Playwright APIs Used in This Lab

| API | What It Does |
|-----|-------------|
| `page.on('dialog', dialog => ...)` | Handles every browser dialog (alert, confirm, prompt) for this page |
| `page.once('dialog', dialog => ...)` | Handles the next dialog only — reverts to default after one use |
| `dialog.accept()` | Clicks OK on the dialog |
| `dialog.dismiss()` | Clicks Cancel / closes the dialog |
| `page.on('console', msg => ...)` | Listens to all browser console output (log, warn, error) |
| `page.on('pageerror', msg => ...)` | Listens to uncaught JavaScript exceptions thrown by the page |
| `expect.soft(locator)` | Soft assertion — test continues on failure, all failures reported at end |
| `page.context().cookies()` | Returns all cookies in the current browser context |
| `page.context().addCookies([...])` | Adds cookies to the context |
| `page.context().clearCookies()` | Removes all cookies from the context |
| `page.waitForEvent('download')` | Returns a promise that resolves when a download starts |
| `download.failure()` | Returns `null` on success, or an error string on failure |
| `download.path()` | Returns the local filesystem path of the downloaded file |
| `download.saveAs(path)` | Copies the downloaded file to a specified location |
| `locator.setInputFiles(path)` | Sets a file on a `<input type="file">` element without opening the OS dialog |
| `test.skip(condition, reason)` | Skips a test unconditionally or based on a runtime condition |
| `test.fixme()` | Marks a test as known-broken — runs as skipped, signals it needs a fix |
| `test.fail()` | Marks a test as expected to fail — reports as PASSED if it fails, FAILED if it unexpectedly passes |
| `test.describe(name, fn)` | Groups related tests under a named block |
| `test.beforeEach(async ({ page }) => {})` | Runs setup before every test in the enclosing describe block |

---

## Lab

You have practised dialogs, console monitoring, cookies, downloads, and uploads in isolation, then combined them in Part B. Now apply all of it without guidance.

The TestMart `/savings` page has two downloadable files. The `/loans` page accepts file uploads. The `/advanced-scenarios` page has interactive elements that may emit console events.

Your task: write a standalone test in a new file `tests/full-advanced.spec.ts` that:

- Monitors the page for console errors and uncaught exceptions throughout using `expect.soft`
- Navigates to `/advanced-scenarios`, fills the First Name field, and clears it by **accepting** the confirmation dialog — assert the field is empty afterwards
- Navigates to `/savings` and downloads **both** files (zip and previewable) — assert both downloads completed without failure and both files exist on disk
- Navigates to `/loans` and uploads one of the downloaded files — the upload input should have the file set before you are done
- The test must pass on 3 consecutive runs with no `waitForTimeout` calls anywhere

> Stuck? Try the [hints](hints.md) or check the [solution](solution.md).

---

*Proceed to **Session 5 — Page Object Model & Hybrid Testing** once all acceptance criteria are met.*
