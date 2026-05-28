import { Given, When, Then, Before, After, setDefaultTimeout } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { PlaywrightWorld } from "../world/playwright-world";
import { LoginPage } from "../pages/login.page";
import { ProductsPage } from "../pages/products.page";

setDefaultTimeout(30 * 1000)

Before(async function (this: PlaywrightWorld) {
  await this.init();
});

After(async function (this: PlaywrightWorld) {
  await this.teardown();
});

Given(
  "I am logged in as a standard customer",
  async function (this: PlaywrightWorld) {
    const loginPage = new LoginPage(this.page);
    await loginPage.navigate("/login");
    await loginPage.loginWith("standard_user@example.com", "Password123!");
  },
);

When(
  "I search for {string}",
  async function (this: PlaywrightWorld, query: string) {
    const productsPage = new ProductsPage(this.page);
    await productsPage.goto();
    await productsPage.search(query);
  },
);

Then(
  "I should see {int} product in the results",
  async function (this: PlaywrightWorld, count: number) {
    await expect(this.page.getByTestId("product-card")).toHaveCount(count);
  },
);

Then(
  "the product name should be {string}",
  async function (this: PlaywrightWorld, name: string) {
    await expect(this.page.getByTestId("product-name").first()).toHaveText(
      name,
    );
  },
);

Then(
  "I should see the message {string}",
  async function (this: PlaywrightWorld, message: string) {
    await expect(this.page.getByTestId("no-results-message")).toHaveText(
      message,
    );
  },
);
