import {
  createUser,
  createProduct,
  createCartItem,
  buildOrder,
} from "./testmart-data";

const user = createUser({ email: "tester@example.com" });
const product = createProduct({ name: "Keyboard", price: 89.99 });
const cart = [createCartItem({ product, quantity: 2 })];
const order = buildOrder(user, cart);

console.log("user.email   :", user.email); // tester@example.com
console.log("order.total  :", order.total); // 179.98
console.log("order.items  :", order.itemCount); // 2

// Type-safe override — this line should NOT cause a type error:
const adminUser = createUser({ role: "admin" });
console.log("role:", adminUser.role); // admin
