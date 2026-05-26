import { test } from "@playwright/test";

test.use({ headless: true });

test("Test 1", async ({ page }) => {
  await page.goto("/");
  await page.goBack();
  console.log("test running...");
});
