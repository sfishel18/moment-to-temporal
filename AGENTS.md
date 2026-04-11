# moment-to-temporal

A JSCodeshift codemod that transforms Moment.js code into TC39 Temporal API code. It processes `.js/.jsx/.ts/.tsx` files, replacing Moment.js method chains with equivalent Temporal API calls.

## Commands

| Task              | Command          |
| ----------------- | ---------------- |
| Install           | `pnpm install`   |
| Test              | `pnpm test`      |
| Build (to `lib/`) | `pnpm run build` |
| Docs dev server   | `pnpm run docs`  |

## Tech Stack

TypeScript, jscodeshift (AST transforms), Vitest (tests), pnpm (package manager). Runtime deps shipped to end-users: `@js-temporal/polyfill`, `date-fns`.

## Directory Layout

```
src/
  transform.ts          # Main jscodeshift entry point
  types.ts              # ChainProcessor interface
  ast-utils.ts          # AST traversal helpers (find moment refs, annotate)
  transformations/
    parse.ts            # moment() factory call -> Temporal
    manipulate.ts       # .add(), .subtract(), .startOf(), .endOf()
    display.ts          # .toDate(), .toISOString(), .format() (isBreaking: true)
    imports.ts          # Import factories (memoized with lodash/once)
  runtime/              # Utility functions shipped to end-user code
test/
  all-cases.test.ts     # Auto-discovers and runs all test cases
  cases/                # Test cases by category (parse/, manipulate/, display/)
bin/
  cli.cjs               # CLI entry point (npx moment-to-temporal)
docs/                   # Interactive docs site (SolidJS + Vite)
lib/                    # Compiled output (gitignored)
```

## Architecture (Brief)

The codemod finds all `moment()` calls, builds a method chain for each, and processes the chain through a pipeline of `ChainProcessor` objects (defined in `src/types.ts`). Each processor handles one Moment.js method (e.g., `add`, `toDate`). Processors with `isBreaking: true` produce a non-Moment value -- at least one must be present in the chain for transformation to succeed. Unsupported methods get an annotation comment in the output.

## Skills

Before starting work, load the relevant skill for your task:

| Task                                       | Skill                  |
| ------------------------------------------ | ---------------------- |
| Add support for a new Moment.js method     | `add-chain-processor`  |
| Add a runtime utility function             | `add-runtime-utility`  |
| Write or understand test cases             | `write-test-cases`     |
| Understand the transform pipeline in depth | `codemod-architecture` |
