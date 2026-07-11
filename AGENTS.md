# moment-to-temporal

A JSCodeshift codemod that transforms Moment.js code into TC39 Temporal API code. It processes `.js/.jsx/.ts/.tsx` files, replacing Moment.js method chains with equivalent Temporal API calls.

## Commands

| Task              | Command          |
| ----------------- | ---------------- |
| Install           | `pnpm install`   |
| Test              | `pnpm test`      |
| Mutation testing  | `pnpm test:mutation` |
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

## Mutation Testing (Stryker)

`pnpm test:mutation` runs [StrykerJS](https://stryker-mutator.io/) with the vitest runner
(config: `stryker.config.json`, HTML report: `reports/mutation/mutation.html`). CI runs it
on every pull request and fails below a 95% mutation score (`thresholds.break`); the
remaining ~3% are classified equivalent/unkillable mutants, so a real regression in test
strength is what pushes the score under the bar. Several settings are load-bearing and
non-obvious — JSON config can't hold comments, so they are documented here:

- **`vitest.related: false` must stay false.** The test suite generates `.mod.ts` files at
  runtime and imports them dynamically, so vitest's static module graph cannot connect test
  files to `src/runtime/**`. With `related` enabled, vitest silently runs _zero_ tests for
  runtime mutants and they all falsely survive.
- **The explicit `plugins` entry is required.** Stryker's default `@stryker-mutator/*`
  wildcard plugin discovery fails under pnpm's node_modules layout.
- **Every test in `test/all-cases.test.ts` runs the transform itself, inside the test
  body.** Do not "optimize" this into a shared `beforeAll` or a memoized helper. Stryker's
  per-test coverage only credits tests that _execute_ mutated code; with a shared transform
  step, the tests that assert on its output (e.g. "moment import removed") fall out of every
  mutant's covering set, Stryker's filtered mutant runs skip them, and mutants falsely
  survive. (The vitest runner always plans per-test — setting `coverageAnalysis: "all"` does
  not change this.)
- **Generated `.mod` file paths are unique per invocation** (`pid` + random token):
  the pid prevents concurrent Stryker workers (which share one sandbox) racing on the same
  files, and the random token defeats the module cache that Stryker's isolation-free reruns
  would otherwise serve stale modules from. A `?v=` query suffix is NOT sufficient — it gets
  normalized away.
- **The transform must be invoked in-process** (via jscodeshift's API), not through a
  subprocess like the hypermod CLI: the vitest runner activates mutants in-memory, so
  mutated code running in a child process never activates and falsely survives.
- Mutation results are cached incrementally in `reports/stryker-incremental.json`
  (gitignored). Delete it if results look stale — config changes do not invalidate it.

## Skills

Before starting work, load the relevant skill for your task:

| Task                                       | Skill                  |
| ------------------------------------------ | ---------------------- |
| Add support for a new Moment.js method     | `add-chain-processor`  |
| Add a runtime utility function             | `add-runtime-utility`  |
| Write or understand test cases             | `write-test-cases`     |
| Understand the transform pipeline in depth | `codemod-architecture` |
