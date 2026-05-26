import { Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto("/cart");
  }

  get cartItems() {
    return this.page.getByTestId("cart-item");
  }

  get cartCount() {
    return this.page.getByTestId("cart-count");
  }

  async checkout() {
    await this.page.getByTestId("checkout-btn").click();
  }
}
