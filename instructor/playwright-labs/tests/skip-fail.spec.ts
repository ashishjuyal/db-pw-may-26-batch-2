import { test, expect } from "@playwright/test";

// test.skip();

test.skip("Example 1: Skipping", async ({ page }) => {
  console.log('this should not print...');
});

test("Example 2: conditionally skipping", async ({ page, browserName }) => {
  // gaurd claude
  test.skip(browserName === 'chromium', "This will not run in chromium, defect ID ABC-123");

  await page.goto('');
  test.skip(await page.getByTestId('someTestId').count() === 0, "someTestId should be present to run this test...")
  console.log('this should also not print...');
});

test.fixme("Example 3: fixme", async ({ page, browserName }) => {
  console.log("this should be fixed....");
});

test("Example 4: fail", async ({ page, browserName }) => {
  test.fail(); // this should fail
  expect(2).toEqual(3);
});

// AAA

// Arrange -> setup
// Act  -> 
// Assert -> 
// cleanup
