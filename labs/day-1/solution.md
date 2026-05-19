# Lab Solution — Session 1 TypeScript Fundamentals

Create `src/testmart-data.ts`:

```typescript
// ── Interfaces ────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin' | 'locked';
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutPayload {
  fullName: string;
  address: string;
  city: string;
  postcode: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface Order {
  user: User;
  items: CartItem[];
  total: number;
  itemCount: number;
}

// ── Factory functions ─────────────────────────────────────────────────────────

// Partial<T> means every field is optional — the spread merges overrides over defaults
export function createUser(overrides?: Partial<User>): User {
  return {
    id: 1,
    email: 'standard_user@example.com',
    password: 'Password123!',
    name: 'Alex Johnson',
    role: 'user',
    ...overrides,
  };
}

export function createProduct(overrides?: Partial<Product>): Product {
  return {
    id: 1,
    name: 'Wireless Headphones',
    description: 'Premium noise-cancelling headphones',
    price: 149.99,
    category: 'Electronics',
    stock: 25,
    ...overrides,
  };
}

export function createCartItem(overrides?: Partial<CartItem>): CartItem {
  return {
    product: createProduct(),
    quantity: 1,
    ...overrides,
  };
}

export function createCheckoutPayload(overrides?: Partial<CheckoutPayload>): CheckoutPayload {
  return {
    fullName: 'Alex Johnson',
    address: '123 Test Street',
    city: 'Sydney',
    postcode: '2000',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/28',
    cvv: '123',
    ...overrides,
  };
}

// ── buildOrder ─────────────────────────────────────────────────────────────────

// reduce() accumulates price * quantity across all cart items
export function buildOrder(user: User, items: CartItem[]): Order {
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    user,
    items,
    total: Math.round(total * 100) / 100,  // round to 2 decimal places
    itemCount,
  };
}
```

### Verify it works

Create `src/testmart-data-test.ts`:

```typescript
import { createUser, createProduct, createCartItem, buildOrder } from './testmart-data';

const user    = createUser({ email: 'tester@example.com' });
const product = createProduct({ name: 'Keyboard', price: 89.99 });
const cart    = [createCartItem({ product, quantity: 2 })];
const order   = buildOrder(user, cart);

console.log('user.email   :', user.email);        // tester@example.com
console.log('order.total  :', order.total);       // 179.98
console.log('order.items  :', order.itemCount);   // 2

// Type-safe override — this line should NOT cause a type error:
const adminUser = createUser({ role: 'admin' });
console.log('role:', adminUser.role);             // admin
```

Run:

```bash
npx tsc --noEmit        # must exit with zero errors
npx ts-node src/testmart-data-test.ts
```

### Why this matters for Playwright tests

In Session 4 onwards, you will call `createProduct()` and `createUser()` to build test data payloads for `request.post('/api/products', { data: createProduct(...) })`. Having typed factory functions means:
- VS Code autocomplete shows every field
- A typo in a field name is a compile error, not a silent runtime failure
- Overriding one field for a specific test is one line: `createProduct({ stock: 0 })`

---

> Back to the [lab](README.md).
