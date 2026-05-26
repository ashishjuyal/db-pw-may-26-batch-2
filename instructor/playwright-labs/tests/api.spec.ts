import { expect, test } from "@playwright/test";


test.skip('Example 1: Simple API interaction', async({ page }) => {

  const response = await page.goto('/');

  if (response == null) return;
  
  console.log(await response.text());
  console.log(response.status());
});

test("Example 2: Simple API interaction", async ({ request }) => {
  const response = await request.get('/api/products');

  expect(response).not.toBeNull();
  expect(response.ok()).toBeTruthy();
  const apiResponse = await response.json();

  expect(apiResponse.products.length).toEqual(12);
  expect(apiResponse.count).toEqual(12);
});