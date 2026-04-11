---
name: add-runtime-utility
description: Use when the user needs to add a new helper function to a compiler/transpiler runtime that will be included in transformed output. Define the helper function, register it in the runtime module, wire it into the code generation pass, and add tests for the injected output.
---

# Adding a Runtime Utility

Runtime utilities are helper functions that get imported into the user's codebase by the codemod. They bridge gaps where Temporal doesn't have a direct 1:1 replacement for a Moment.js feature. Examples: `toLegacyDate`, `toFormattedString`, `toEpochNanos`.

Only create a runtime utility when the Temporal replacement cannot be expressed as a single inline AST expression. Prefer inline AST when possible.

## 1. Create the Runtime Module

Add a new file in `src/runtime/`. Follow the existing naming convention (kebab-case, default export):

```
src/runtime/my-utility.ts
```

```ts
import { type Temporal } from "@js-temporal/polyfill";

export default (dateTime: Temporal.ZonedDateTime): ReturnType => {
  // implementation
};
```

### Conventions

- **Default export**: Always use a default export. The import factory generates `import myUtility from 'moment-to-temporal/runtime/my-utility'`.
- **Type-only polyfill import**: Use `import { type Temporal }` to avoid bundling the polyfill into the runtime module. The end-user project provides `@js-temporal/polyfill` as a peer dependency.
- **Peer dependencies**: You may use `@js-temporal/polyfill` and `date-fns` (both are peer deps in `package.json`). Do not add other runtime dependencies without updating `package.json`.
- **Keep it small**: These functions ship into the user's code. Keep them focused and minimal.

## 2. Create an Import Factory

In `src/transformations/imports.ts`, add a memoized import factory:

```ts
export const myUtilityImport: (j: JSCodeshift) => ImportDeclaration = once(
  (j) =>
    j.template
      .statement`import myUtility from 'moment-to-temporal/runtime/my-utility';`,
);
```

The `once()` wrapper (from lodash) ensures the import declaration is created only once per transform run, even if multiple chains use it.

## 3. Register in allImports and importDependencyMap

Still in `src/transformations/imports.ts`:

```ts
export const allImports = [
  pollyfillImport,
  toLegacyDateImport,
  toFormattedStringImport,
  toEpochNanosImport,
  myUtilityImport, // <-- add here
];

export const importDependencyMap: Map<unknown, string[]> = new Map([
  [pollyfillImport, ["@js-temporal/polyfill"]],
  [toLegacyDateImport, ["@js-temporal/polyfill", "moment-to-temporal"]],
  // ...
  [myUtilityImport, ["@js-temporal/polyfill", "moment-to-temporal"]], // <-- add here
]);
```

The `importDependencyMap` tells the CLI which npm packages the user needs to install. Runtime utilities always require both `@js-temporal/polyfill` and `moment-to-temporal`.

## 4. Add Path Aliases

The test runner and docs site import runtime modules by their package path (`moment-to-temporal/runtime/my-utility`), but during development these need to resolve to the TypeScript source. Add aliases in two files:

### `vitest.config.ts`

```ts
resolve: {
  alias: {
    // existing aliases...
    "moment-to-temporal/runtime/my-utility": path.resolve(
      __dirname,
      "src/runtime/my-utility.ts",
    ),
  },
},
```

### `docs/vite.config.ts`

```ts
resolve: {
  alias: {
    // existing aliases...
    "moment-to-temporal/runtime/my-utility": path.resolve(
      __dirname,
      "../src/runtime/my-utility.ts",
    ),
  },
},
```

Note the `../` prefix in the docs config since it's in the `docs/` subdirectory.

## 5. Use It in a Chain Processor

In your processor's `process` function:

```ts
imports.push(myUtilityImport(j));
return j.template.expression`myUtility(${next})`;
```

## 6. Verify

```sh
pnpm test
pnpm run build
```

The build compiles `src/runtime/` into `lib/runtime/`, which is what gets published to npm (the `"files"` field in `package.json` includes `lib/**`).

## Existing Runtime Utilities (for reference)

| Module                                | Import name         | Purpose                                                                                                                                         |
| ------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/runtime/to-legacy-date.ts`       | `toLegacyDate`      | Converts `Temporal.ZonedDateTime` to legacy `Date`                                                                                              |
| `src/runtime/to-formatted-string.ts`  | `toFormattedString` | Formats a `Temporal.ZonedDateTime` using a Moment-compatible format string (delegates to `date-fns`)                                            |
| `src/runtime/to-epoch-nanos.ts`       | `toEpochNanos`      | Parses string/number input into `BigInt` epoch nanoseconds for `Temporal.ZonedDateTime` constructor                                             |
| `src/runtime/formatting-utils.ts`     | (internal)          | Maps Moment format tokens to date-fns format tokens. Used by `toFormattedString` and `toEpochNanos`, not imported directly by transformed code. |
| `src/runtime/from-string.ts`          | (legacy)            | Older string parser, may be unused. Check before depending on it.                                                                               |
| `src/runtime/InvalidZonedDateTime.ts` | (internal)          | Sentinel object for invalid date handling.                                                                                                      |
