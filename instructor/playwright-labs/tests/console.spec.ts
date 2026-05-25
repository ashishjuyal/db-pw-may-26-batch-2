import { test, expect } from "@playwright/test";

test("Example 1: console logs", async ({ page }) => {

  page.on("console", (msg) => {
    console.log(`${msg.type()}: ${msg.text()}`);
    expect.soft(msg.type()).not.toEqual('error');
  });

  page.on("pageerror", (msg) => {
    console.log(`${msg.name}: ${msg.message}`);
    expect.soft(msg.name).not.toEqual("Error");
  });

  await page.goto('/advanced-scenarios');
  await page.getByRole('button',{name: "Register"}).click();

});