import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { ProductsPage } from "./pages/products.page";
import { CartPage } from "./pages/cart.page";


test.describe('Login Feature', () => {
  let loginPage:LoginPage;

  test.beforeEach(({page}) => {
    loginPage = new LoginPage(page);
  })
  
  test("login with valid credentials", async ({ page }) => {
    await loginPage.login("standard_user@example.com", "Password123!");  
    await loginPage.assertSuccessful();
  });
  
  test("login with invalid credentials shows error", async ({ page }) => {
    loginPage.login("wrong@example.com", "wrong@example.com");
    await loginPage.assertLoginError("Invalid email or password");
  });

  test("add product to cart and verify cart count", async ({ page }) => {    
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);

    await loginPage.login("standard_user@example.com", "Password123!");
    await productsPage.goto();
    await productsPage.search("Keyboard");
    await expect(productsPage.productCards).toHaveCount(1);
    await productsPage.addToCart("Mechanical Keyboard");
    await expect(cartPage.cartCount).toHaveText("1");
  });
});

