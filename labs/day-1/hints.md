# Lab Hints — Session 1 TypeScript Fundamentals

## Interfaces

Look at the TestMart seed data and API responses in `testmart.md` to know which fields to include. Focus on the fields each factory function will need to produce a usable default. You don't need to match every field in the database — only the ones relevant to a test.

## Factory functions

A factory function returns a plain object literal with sensible defaults. Use the `Partial<T>` type for the `overrides` parameter and the spread operator (`...`) to merge the defaults with any overrides — the same pattern you used in Step 3 of the guided lab.

## `CartItem`

A cart item references a product rather than duplicating its fields. Think about what a test would need from a cart item: the product itself, the quantity, and a way to compute the line total.

## `buildOrder`

The total is the sum of `price * quantity` across all cart items. TypeScript can infer the return type — but writing it explicitly (as an interface or inline type) will catch mistakes. You already know how to use `array.reduce()` from the guided exercises.

## Type check

Run `npx tsc --noEmit` after each interface you write, not just at the end. Fixing errors one at a time is much easier than fixing all of them together.

> Need more? Here's the [solution](solution.md).

---

> Back to the [lab](README.md).
