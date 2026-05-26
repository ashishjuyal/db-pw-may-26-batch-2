import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class ProductsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigate("/products");
  }

  async search(term: string) {
    await this.page.getByTestId("search-input").fill(term);
    // await this.page.getByTestId("search-btn").click();
    await expect(this.page.getByTestId("loading-spinner")).not.toBeVisible();
  }

  get productCards() {
    return this.page.getByTestId("product-card");
  }

  get productNames() {
    return this.page.getByTestId("product-name");
  }

  async addToCart(productName: string) {
    await this.productCards
      .filter({ hasText: productName })
      .getByTestId("add-to-cart-btn")
      .click();
  }
}
