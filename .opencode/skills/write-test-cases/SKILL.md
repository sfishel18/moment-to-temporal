---
name: write-test-cases
description: 'How to write and understand test cases for the codemod, including conventions for positive cases, negative cases, and the auto-discovery test runner. Use when the user needs to create, debug, or understand the mechanics test cases for codemods.'
---

# Writing Test Cases

## How the Test Runner Works

There is a single test file: `test/all-cases.test.ts`. It auto-discovers test cases and requires no registration.

The runner:

1. Globs `test/cases/**/*.{js,ts}`, excluding files matching `*.mod.*`.
2. For each file, copies it to a `.mod.ts` sibling (e.g., `add.ts` -> `add.mod.ts`).
3. Runs the actual codemod on the `.mod.ts` copy via `@hypermod/cli`.
4. Dynamically imports both the original and transformed files.
5. For each exported function, asserts `original.fn() === transformed.fn()`.
6. If the case exports `expectNoMoment = true`, also asserts the `moment` import was removed from the transformed file.

**Key implication**: the test proves behavioral equivalence. The original function uses Moment.js; the transformed version uses Temporal. If both return the same value, the transform is correct.

## File Location

Place test cases in the subdirectory matching the transformation category:

```
test/cases/
  parse/              # For moment() factory call variants
  manipulate/         # For .add(), .subtract(), .startOf(), .endOf()
  display/            # For .toDate(), .toISOString(), .format()
```

Create a new subdirectory if adding an entirely new category (rare).

## Positive Test Case Format

```ts
import moment from "moment";

export const descriptiveCaseName = (): string => {
  return moment().someMethod().toDate().toISOString();
};

export const anotherCase = (): number => {
  return moment().someOtherMethod().toDate().getTime();
};

export const expectNoMoment = true;
```

### Rules

- **Import moment**: Every test file must `import moment from "moment"`.
- **Export named functions**: Each function is one test case. The name becomes the test name.
- **Return a primitive**: Functions must return a value comparable with `toEqual()` (string, number, boolean, Date). Avoid returning Moment or Temporal objects directly.
- **End with a breaking call**: Since the codemod requires at least one breaking method in the chain, test chains must include one (e.g., `.toDate()`, `.toISOString()`, `.format()`).
- **`expectNoMoment`**: Export `true` when the codemod should fully replace all moment usage and remove the import. Export `false` (or omit) when some moment usage intentionally remains untransformed.
- **Determinism**: The test runner calls `vi.useFakeTimers()` before each test, so `moment()` and `Temporal.Now` return a stable time. Time-dependent assertions are safe.

## Negative Test Cases

For inputs the codemod intentionally cannot transform, create a separate file with the `-negative-cases` suffix:

```
test/cases/manipulate/add-negative-cases.ts
```

```ts
import moment from "moment";

export const quartersAsUnits = (): string => {
  return moment().add(1, "quarter").toDate().toISOString();
};

export const expectNoMoment = false;
```

These test that the original and transformed files still produce the same result, even though the codemod couldn't fully transform the code (the moment import remains).

## Focusing Tests

To run only specific test cases during development, rename the file to use `.only.ts`:

```
add.ts -> add.only.ts
```

The runner checks for `.only.js` / `.only.ts` files and, if any exist, runs only those. Remember to rename back before committing.

**Important**: `.mod.*` files are gitignored. They are generated artifacts and should never be committed.

## Running Tests

```sh
pnpm test
```

This runs `vitest --run`, which executes `test/all-cases.test.ts`. There are no other test files.

## Example Walkthrough

For `test/cases/manipulate/add.ts`:

```ts
import moment from "moment";

export const primitveArguments = (): string => {
  return moment().add(1, "minutes").toDate().toISOString();
};

export const expectNoMoment = true;
```

After the codemod runs, `add.mod.ts` will contain something like:

```ts
import { Temporal } from "@js-temporal/polyfill";
import toLegacyDate from "moment-to-temporal/runtime/to-legacy-date";

export const primitveArguments = (): string => {
  return toLegacyDate(
    Temporal.Now.zonedDateTimeISO().add({ minutes: 1 }),
  ).toISOString();
};

export const expectNoMoment = true;
```

The test asserts `primitveArguments()` returns the same ISO string in both versions.
