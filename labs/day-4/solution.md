# Lab Solution — Session 3 Advanced Interactions

## Complete test

**`tests/full-advanced.spec.ts`:**

```typescript
import { test, expect } from '@playwright/test';
import fs from 'fs';

test('advanced interactions: dialog, console, download, upload', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors:    string[] = [];

  // Register listeners BEFORE any navigation — they only catch events after registration
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  // ── /advanced-scenarios: fill, accept dialog, assert cleared ───────────────
  await page.goto('/advanced-scenarios');
  await page.getByLabel('First name').fill('TestUser');

  // Register one-time handler immediately before the click that triggers the dialog
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByLabel('First name')).toHaveValue('');

  // ── /savings: download zip (non-previewable — triggers automatically) ───────
  await page.goto('/savings');
  const zipPromise = page.waitForEvent('download');
  await page.getByTestId('download-zip').click();
  const zipDownload = await zipPromise;

  expect(await zipDownload.failure()).toBeNull();
  const zipPath = await zipDownload.path();
  expect(zipPath).not.toBeNull();
  expect(fs.existsSync(zipPath!)).toBe(true);

  // ── /savings: download PDF (previewable — must add 'download' attribute first)
  const pdfLink = page.getByTestId('download');
  await pdfLink.evaluate(el => (el as HTMLAnchorElement).setAttribute('download', ''));
  const pdfPromise = page.waitForEvent('download');
  await pdfLink.click();
  const pdfDownload = await pdfPromise;

  expect(await pdfDownload.failure()).toBeNull();
  const pdfPath = await pdfDownload.path();
  expect(pdfPath).not.toBeNull();
  expect(fs.existsSync(pdfPath!)).toBe(true);

  // ── /loans: upload the downloaded zip ──────────────────────────────────────
  await page.goto('/loans');
  await page.locator('input[type="file"]').setInputFiles(zipPath!);

  // ── Assert no console errors or uncaught exceptions throughout ─────────────
  expect.soft(consoleErrors, 'No console errors expected').toHaveLength(0);
  expect.soft(pageErrors,    'No uncaught exceptions expected').toHaveLength(0);
});
```

## Why this solution is structured this way

**Listener registration order:** `page.on('console')` and `page.on('pageerror')` are registered before the first `goto()`. Any console errors that occur during page load are captured. If the listeners were registered after navigation, errors from that first page load would be missed.

**`page.once` placement:** The one-time dialog handler is registered immediately before the click that fires the dialog, not at the top of the test. Registering it at the top works too, but registering close to the triggering action makes it clear which click it covers. If there were multiple dialog-triggering actions in the same test, placement would matter.

**Zip download:** Non-previewable files trigger the download event automatically when the link is clicked. The `waitForEvent('download')` promise is set up before the click — if the promise were set up after the click, the event could fire before we are listening and the test would hang.

**PDF download:** `dummy.pdf` has no `download` attribute on the `<a>` tag, so the browser would open it in a new tab rather than download it. Adding the attribute with `evaluate()` before clicking forces the browser to treat it as a download. This is the same pattern shown in Example 4.

**`zipPath!`:** The `!` is a TypeScript non-null assertion. We have already asserted `zipPath` is not null two lines above, so this is safe. Alternatively, use an `if (!zipPath) throw new Error(...)` guard.

**`expect.soft` at the end:** Soft assertions let the test continue even if a violation is found. By collecting errors in arrays throughout and asserting at the end, you get a full report of all console issues rather than stopping at the first one.

---

> Back to the [lab](README.md).
