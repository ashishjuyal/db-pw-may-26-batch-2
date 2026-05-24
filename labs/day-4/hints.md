# Lab Hints — Session 3 Advanced Interactions

## Console listeners

Register `page.on('console', ...)` and `page.on('pageerror', ...)` before the very first `page.goto()` call — they only capture events that occur after registration. Collect the messages into arrays and run `expect.soft` checks at the end of the test.

## Dialog on the Clear button

Use `page.once('dialog', dialog => dialog.accept())` — register it immediately before the `click()` that triggers the dialog, not before `page.goto()`. `page.once` fires for the very next dialog and then unregisters itself.

## Downloading the zip file

The zip is non-previewable so the browser downloads it automatically. Set up the download promise with `page.waitForEvent('download')` **before** clicking — don't await it yet. Click the button, then await the promise. Check `await download.failure()` is `null` and `await download.path()` is not `null`.

## Downloading the previewable PDF

The browser opens PDFs in a tab instead of downloading them. To force a download, get the locator with `page.getByTestId('download')`, call `await pdfLink.evaluate(el => el.setAttribute('download', ''))` to add the `download` attribute, then set up `waitForEvent('download')` and click as normal.

## Uploading the downloaded file

`download.path()` returns `Promise<string | null>` — await it to get the string. Pass that string directly to `page.locator('input[type="file"]').setInputFiles(path)`. The temp file still exists because the upload happens within the same test function.

> Need more? Here's the [solution](solution.md).

---

> Back to the [lab](README.md).
