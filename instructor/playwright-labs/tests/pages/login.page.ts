import { expect, Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async login(email: string, password: string) {
    await this.navigate("/login");
    await this.page.getByTestId("login-email").fill(email);
    await this.page.getByTestId("login-password").fill(password);
    await this.page.getByTestId("login-submit").click();
  }
  
  get errorMessage() {
    return this.page.getByTestId("login-error");
  }
  
  async assertLoginError(message: string) {
    await expect(this.page.getByTestId("login-error")).toHaveText(message);
  }
  
  async assertSuccessful() {
    await expect(this.page.getByTestId("nav-username")).toBeVisible();
  }
}
