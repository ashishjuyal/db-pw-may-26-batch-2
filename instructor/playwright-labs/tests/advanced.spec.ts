import { test, expect } from "@playwright/test";

const name = "Playwright";

test("Example 1: default dialog handling ", async ({ page }) => {
  await page.goto('/advanced-scenarios');
  
  const firstName = page.getByLabel('First name');
  await firstName.fill(name);

  await page.getByText('Clear').click();

  expect (firstName).toHaveValue(name);
});

test("Example 2: accept dialog", async ({ page }) => {

  page.on('dialog', dialog => dialog.accept());

  await page.goto("/advanced-scenarios");

  const firstName = page.getByLabel("First name");
  await firstName.fill(name);

  await page.getByText("Clear").click();

  expect(firstName).toHaveValue("");
});

test("Example 3: accept dialog only once", async ({ page }) => {
  page.once("dialog", (dialog) => dialog.accept());

  await page.goto("/advanced-scenarios");
  const firstName = page.getByLabel("First name");
  
  // first time
  await firstName.fill(name);
  await page.getByText("Clear").click();
  expect(firstName).toHaveValue("");

  // second time
  await firstName.fill(name);
  await page.getByText("Clear").click();
  expect(firstName).toHaveValue(name);

});