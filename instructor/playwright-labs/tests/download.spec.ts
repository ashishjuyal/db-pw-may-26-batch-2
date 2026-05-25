import { test, expect } from "@playwright/test";
import fs from 'fs';

test("Example 1: download non-previewable", async ({ page }) => {

  const downloadFile = page.waitForEvent("download");

  await page.goto("/savings");
  await page.getByTestId('download-zip').click();

  const download = await downloadFile;

  expect (await download.failure()).toBeNull();

  // console.log(await download.path());
  // console.log(await download.suggestedFilename());
  // await download.saveAs("/downloads/my.pdf");  
});

test("Example 2: download previewable", async ({ page }) => {
  const downloadFile = page.waitForEvent("download");
  await page.goto("/savings");
  // await page.getByTestId("download").click();

  // OPTION 1:
  const downloadLink = page.getByTestId("download");
  // await downloadLink.evaluate((el) => el.setAttribute('download', ''));
  // await downloadLink.click();

  // OPTION 2
  await downloadLink.click( { modifiers: ['Alt']}); // ALT + Click
  const download = await downloadFile;
  
  const path = await download.path();
  expect(fs.existsSync(path)).toBeTruthy();
  // console.log("Size: ", fs.statSync(path).size);

  expect(fs.statSync(path).size).toBeLessThan(20_000);

  expect(await download.failure()).toBeNull();
});