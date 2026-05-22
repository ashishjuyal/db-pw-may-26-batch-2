import { UserCredentials, Product } from "./types";

function formattedUser(cred:UserCredentials): string {
  // return cred.username + " " + "(" + (cred.role ?? "Standard user") + ")";
  return `${cred.username} (${cred.role ?? 'Standard user'})`
}

const admin: UserCredentials = {
  username: "admin@example.com",
  password: "password!",
  role: "admin"
}
const standard: UserCredentials = {
  username: "standard@example.com",
  password: "password!",
};

console.log(formattedUser(admin));
console.log(formattedUser(standard));





function getAffordableProducts(products: Product[], maxPrice: number): Product[] {
  // return products.filter(p => isPriceLower(p, maxPrice));
  return products.filter(p => p.price <= maxPrice);
}

function isPriceLower(p:Product, maxPrice: number): boolean {
  return p.price <= maxPrice;
}

const products: Product[] = [
  { id: "p-1", name: "Basic Plan", price: 99, inStock: true },
  { id: "p-2", name: "Pro Plan", price: 299, inStock: true },
  { id: "p-3", name: "Enterprise", price: 999, inStock: false },
];

const affordable = getAffordableProducts(products, 300);
console.log(affordable);

