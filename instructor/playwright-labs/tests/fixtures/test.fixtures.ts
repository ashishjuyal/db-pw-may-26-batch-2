import { test as base } from "@playwright/test";
import { CartPage } from "../pages/cart.page";
import { LoginPage } from "../pages/login.page";
import { ProductsPage } from "../pages/products.page";

type Fixtures = {
  loginPage: LoginPage;
  productsPage: ProductsPage;
  cartPage: CartPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
});

export {expect} from "@playwright/test";

