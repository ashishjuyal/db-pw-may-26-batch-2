import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {

  userEmail: Locator
  loginError: Locator

  constructor(page: Page) {
    super(page);
    this.userEmail = this.page.getByTestId("login-email");
    this.loginError = this.page.getByTestId("login-error");
  }

  async loginWith(email: string, password: string) {
    await this.navigate("/login");
    await this.userEmail.fill(email);
    await this.page.getByTestId("login-password").fill(password);
    await this.page.getByTestId("login-submit").click();
  }
  
  get errorMessage() {
    return this.loginError;
  }
  
  async assertLoginError(message: string) {
    await expect(this.loginError).toHaveText(message);
  }
  
  async assertSuccessful() {
    await expect(this.page.getByTestId("nav-username")).toBeVisible();
  }
}
