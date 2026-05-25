import { test, expect } from "@playwright/test";

// test.describe.configure({mode: 'serial'});

test.use({
  headless: false,
  locale: 'en-US'
})


test.describe("Feature 1", () => {
  test.use({
    // headless: false,
    locale: "en-ES",
  });

  test.beforeEach(() => console.log("Setup Before each..."));
  test.beforeAll(() => console.log("Setup Before all..."));
  test.afterEach(() => console.log("Cleanup After each..."));
  test.afterAll(() => console.log("Cleanup After all..."));
  
  test("Test 1", async ({page}) => {
    console.log("test 1");
  });
  
  test("Test 2", async ({page}) => {
    console.log("test 2");
  });
});

test.describe("Feature 2", () => {
  
  test("Test 1", async ({page}) => {
    console.log("test 1");
  });
  
  test("Test 2", async ({page}) => {
    console.log("test 2");
  });
});


// test("Test 3", async ({ page }) => {
//   console.log("test 3");
// });
