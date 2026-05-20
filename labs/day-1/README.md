# Session 1 — TypeScript Fundamentals for Testers

> **Lab 0: TypeScript Fundamentals for Testers**
> Build a typed TypeScript helper file from scratch — practising every language feature you will use when writing Playwright tests from Session 2 onwards.

---

## Lab at a Glance

```
Step 1 → Scaffold a TypeScript project (NPM + tsconfig)
Step 2 → Write basic types: string, number, boolean, array
Step 3 → Define interfaces for test data shapes
Step 4 → Write typed functions with parameters and return types
Step 5 → Write and call an async/await function
Step 6 → Convert three JavaScript snippets to TypeScript
Step 7 → Run a full type check and fix all errors
```

> **Why this lab matters:** Every Playwright test you write from Session 2 onwards uses types, interfaces, and async/await. Getting fluent with them now — without the distraction of a browser — means you can focus entirely on testing in Session 2.

---

## Prerequisites

Confirm before starting:

```bash
node -v    # must show v20 or higher
npm -v     # must show v9 or higher
```

If either command fails, install Node.js 20 LTS from nodejs.org before continuing.

---

## Step 1 — Scaffold the Project

Create a fresh directory and initialise it as a TypeScript project:

```bash
mkdir ts-lab && cd ts-lab
npm init -y
npm install --save-dev typescript ts-node
```

**ts-node**: Installs a specialized execution engine. Node.js cannot run TypeScript files directly. `ts-node` acts as a shortcut that compiles your TypeScript code in memory on the fly, allowing you to run `.ts` files directly in your terminal (e.g., `npx ts-node script.ts`) without manually compiling them first.

### Why Use Them Together?

Without `ts-node`, running a TypeScript file is a two-step manual process:
1. `npx tsc file.ts` (Compiles code and creates a `file.js`)
2. `node file.js` (Runs the generated JavaScript file)

    With `ts-node` installed, you combine this into a single, instant command:
    - `npx ts-node file.ts` (Compiles in memory and runs it immediately)

### Generate a `tsconfig.json`:

```bash
npx tsc --init
```

Open the generated `tsconfig.json` and replace its contents with this trimmed version:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "rootDir": "./src",
    "outDir": "./dist",
    "verbatimModuleSyntax": false
  },
  "include": ["src/**/*.ts"]
}
```

Create the source folder and the first file you will use in Step 2:

```bash
mkdir src
touch src/types.ts
```

### Verify

```bash
npx tsc --noEmit
```

No errors, no output — the project is correctly configured. Step 2 will populate `src/types.ts` with content.

---

## Step 2 — Basic Types

Open `src/types.ts` and add the following:

```typescript
const courseName: string  = 'Playwright Automation Bootcamp';
const sessionNumber: number = 1;
const hasLab: boolean = true;
const topics: string[] = ['TypeScript', 'Node.js', 'Playwright'];

console.log(courseName, sessionNumber, hasLab, topics);
```

Run it:

```bash
npx ts-node src/types.ts
```

### Type Error Exercise

Add this line below and observe the red underline in VS Code:

```typescript
const wrongType: number = 'this is a string, not a number';
```

VS Code flags it immediately — TypeScript catches this at write time, not at runtime. Delete the line before continuing.

### Verify

- [ ] `npx ts-node src/types.ts` prints all four values
- [ ] The wrong-type line shows a red underline in VS Code before you even run the file

---

## Step 3 — Interfaces: Test Data Shapes

Interfaces define the exact shape of an object. Every test data object you create in Playwright will be typed with an interface.

Add these interfaces to `src/types.ts`. Note the `export` keyword — without it the file is treated as a plain script and cannot be imported by other files:

```typescript
export interface UserCredentials {
  username: string;
  password: string;
  role?: string;   // the ? means this field is optional
}

export interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}
```

Now create objects using those interfaces:

```typescript
const adminUser: UserCredentials = {
  username: 'admin@example.com',
  password: 'Admin@1234',
  role: 'admin',
};

const standardUser: UserCredentials = {
  username: 'user@example.com',
  password: 'User@1234',
  // role is optional — safe to omit
};

const sampleProduct: Product = {
  id:      'p-001',
  name:    'Playwright Course',
  price:   499,
  inStock: true,
};

console.log(adminUser, standardUser, sampleProduct);
```

Run: `npx ts-node src/types.ts`

### Type Error Exercise

Try adding a field that does not exist in the interface:

```typescript
const badUser: UserCredentials = {
  username: 'x@example.com',
  password: 'pass',
  age: 30,   // 'age' does not exist in UserCredentials
};
```

TypeScript flags `age` as an error. This is **excess property checking** — it stops you from silently passing extra data into functions. Delete the `badUser` block before continuing.

### Verify

- [ ] Both user objects and the product object are created without errors
- [ ] Adding an unknown field to `UserCredentials` shows a type error immediately

---

## Step 4 — Typed Functions

Create `src/helpers.ts`:

```typescript
import { UserCredentials, Product } from './types';

// Returns a formatted string — return type is explicit
function formatCredentials(credentials: UserCredentials): string {
  return `${credentials.username} (${credentials.role ?? 'standard'})`;
}

// Filters an array — takes typed inputs, returns typed output
function getAffordableProducts(products: Product[], maxPrice: number): Product[] {
  return products.filter(p => p.price <= maxPrice);
}

// void return type — this function performs an action, returns nothing
function logTestStart(testName: string): void {
  console.log(`[TEST] Starting: ${testName}`);
}

// Call all three
logTestStart('Login flow');

console.log(
  formatCredentials({ username: 'tester@example.com', password: 'pass' })
);

const products: Product[] = [
  { id: 'p-1', name: 'Basic Plan', price: 99,  inStock: true  },
  { id: 'p-2', name: 'Pro Plan',   price: 299, inStock: true  },
  { id: 'p-3', name: 'Enterprise', price: 999, inStock: false },
];

console.log(
  getAffordableProducts(products, 300)
);
```

Run:

```bash
npx ts-node src/helpers.ts
```

### Type Error Exercise

Try calling `formatCredentials` with a plain number:

```typescript
formatCredentials(42);
```

TypeScript reports: *Argument of type 'number' is not assignable to parameter of type 'UserCredentials'*. This is the exact protection that prevents you from accidentally passing the wrong data into a Playwright helper. Delete the bad call before continuing.

### Verify

- [ ] `[TEST] Starting: Login flow` is printed
- [ ] `formatCredentials` prints `tester@example.com (standard)` — the `??` operator returned the default because `role` was omitted
- [ ] `getAffordableProducts` returns only the two plans priced at 300 or below
- [ ] Passing `42` to `formatCredentials` shows a type error

---

## Step 5 — async/await

This is the single most important concept for Playwright testing. Every browser interaction is asynchronous — `await` is what makes your code wait for it.

Create `src/async-demo.ts`:

```typescript
interface UserCredentials {
  username: string;
  password: string;
}

// Simulates a slow API call (like Playwright's page.goto or page.fill)
function fetchUser(id: string): Promise<UserCredentials> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ username: `user-${id}@example.com`, password: 'secret' });
    }, 500);
  });
}

// async keyword: this function always returns a Promise
async function printUser(id: string): Promise<void> {
  console.log(`Fetching user ${id}...`);

  // await pauses HERE until fetchUser resolves — nothing below runs until it does
  const user = await fetchUser(id);

  console.log(`Got user: ${user.username}`);
}

printUser('42');
```

Run:

```bash
npx ts-node src/async-demo.ts
```

You will see:
```
Fetching user 42...
Got user: user-42@example.com
```

### What Happens Without await

Temporarily remove the `await` keyword:

```typescript
const user = fetchUser(id);   // no await
console.log(`Got user: ${user.username}`);
```

TypeScript immediately flags it: *Property 'username' does not exist on type 'Promise<UserCredentials>'*. This is exactly the error you get if you forget `await` in a Playwright test. Restore the `await` before continuing.

### Verify

- [ ] Output appears in the correct order: "Fetching..." then "Got user:" after ~500ms
- [ ] Removing `await` causes a type error in VS Code before running the file
- [ ] Participant can explain: *"await makes the function pause until the Promise resolves — the line below does not run until the async operation is complete"*

---

## Step 6 — Convert JavaScript to TypeScript

Create `src/convert-me.ts` with these three untyped JavaScript functions. Add type annotations until `npx tsc --noEmit` reports no errors.

```typescript
// Exercise 1 — add parameter types and a return type
function multiply(a, b) {
  return a * b;
}

// Exercise 2 — define an interface for 'user' and add a return type
function getUserLabel(user) {
  return `${user.name} <${user.email}>`;
}

// Exercise 3 — type the parameter, return type, and the resolved value
async function loadConfig(env) {
  const config = await Promise.resolve({ baseUrl: `https://${env}.example.com` });
  return config;
}
```

Run the type checker after each exercise:

```bash
npx tsc --noEmit
```

Fix errors one at a time until it exits cleanly.

### Reference Solution

<details>
<summary>Reveal only after attempting yourself</summary>

```typescript
// Exercise 1
function multiply(a: number, b: number): number {
  return a * b;
}

// Exercise 2
interface User {
  name: string;
  email: string;
}

function getUserLabel(user: User): string {
  return `${user.name} <${user.email}>`;
}

// Exercise 3
interface AppConfig {
  baseUrl: string;
}

async function loadConfig(env: string): Promise<AppConfig> {
  const config = await Promise.resolve({ baseUrl: `https://${env}.example.com` });
  return config;
}
```

</details>

### Verify

- [ ] `npx tsc --noEmit` exits with zero errors after all three conversions

---

## Step 7 — Final Type Check

Run the compiler across the entire project:

```bash
npx tsc --noEmit
```

All files in `src/` are checked. If any errors remain, fix them before marking the lab complete.

---

## Acceptance Criteria

Before moving to Session 2, confirm all of the following:

- [ ] `npx tsc --noEmit` exits with zero errors across all files
- [ ] `UserCredentials` and `Product` interfaces are defined — VS Code shows a type error when an unknown field is added
- [ ] `formatCredentials` returns `string` — hover over a call site in VS Code and confirm the return type is shown
- [ ] `printUser` is `async` and uses `await` — participant can explain why `await` is required and what happens if it is removed
- [ ] All three JavaScript-to-TypeScript conversions are complete with explicit types on every parameter and return value
- [ ] Participant can answer: *"What would TypeScript report if you changed `price: number` to `price: string` in the `Product` interface and tried to pass `499` as the price?"*

---

## Key TypeScript Syntax Cheat Sheet

| Syntax | What it does |
|--------|-------------|
| `const x: string = 'hello'` | Declares `x` as a string |
| `const items: string[]` | Array of strings |
| `interface Foo { bar: string }` | Defines object shape |
| `field?: string` | Optional field in an interface |
| `function f(x: number): string` | Typed parameter and return value |
| `function f(): void` | Function that returns nothing |
| `async function f(): Promise<void>` | Async function returning nothing |
| `const x = await somePromise()` | Wait for a Promise to resolve |
| `npx tsc --noEmit` | Type-check without generating files |

---

## Lab

You have practised TypeScript types, interfaces, functions, and async/await in isolation. Now apply all of it together without guided steps.

The TestMart demo app uses specific data shapes for its users, products, cart items, and checkout payloads. Your task is to create a standalone `src/testmart-data.ts` module in your `ts-lab` project that:

- Defines TypeScript interfaces for `User`, `Product`, `CartItem`, and `CheckoutPayload` — modelled on the real TestMart API response shapes
- Implements a **factory function** for each interface that returns a valid default object and accepts an optional `Partial<T>` override parameter

> **Explore on your own: `Partial<T>`**
> `Partial<T>` is a TypeScript utility type not covered in this session. It takes any interface `T` and makes every field optional — which is exactly the right signature for a factory function where you want sensible defaults but the caller can override only the fields that matter for a given test. Look it up in the TypeScript docs and experiment with it here. Once you are comfortable, also look at `Required<T>`, `Pick<T, K>`, and `Omit<T, K>` — these four utility types come up constantly when building test data factories for real applications like TestMart.

- Exports a `buildOrder` function that takes a `User` and an array of `CartItem` objects and returns an object with the correct total and item count — typed correctly throughout
- Passes `npx tsc --noEmit` with zero errors

The module must be usable like this:

```typescript
const user    = createUser({ email: 'tester@example.com' });
const product = createProduct({ name: 'Keyboard', price: 89.99 });
const cart    = [createCartItem({ product, quantity: 2 })];
const order   = buildOrder(user, cart);
// order.total === 179.98, order.itemCount === 2
```

> Stuck? Try the [hints](hints.md) or check the [solution](solution.md).

---

*Proceed to **Session 2 — Playwright Core: Setup, Locators and First Tests** once all acceptance criteria are met.*
