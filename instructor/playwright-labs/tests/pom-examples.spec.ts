import { test, expect } from "./fixtures/test.fixtures";

test.describe('Login Feature', () => {
  
  test("login with valid credentials", async ({ loginPage }) => {
    await loginPage.loginWith("standard_user@example.com", "Password123!");  
    await loginPage.assertSuccessful();
  });
  
  test("login with invalid credentials shows error", async ({ loginPage }) => {
    loginPage.loginWith("wrong@example.com", "wrong@example.com");
    await loginPage.assertLoginError("Invalid email or password");
  });

  test("add product to cart and verify cart count", async ({ loginPage, productsPage, cartPage }) => {    
    await loginPage.loginWith("standard_user@example.com", "Password123!");
    await productsPage.goto();
    await productsPage.search("Keyboard");
    await expect(productsPage.productCards).toHaveCount(1);
    await productsPage.addToCart("Mechanical Keyboard");
    await expect(cartPage.cartCount).toHaveText("1");
  });
});

