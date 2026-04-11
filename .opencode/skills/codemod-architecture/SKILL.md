---
name: codemod-architecture
description: Use when you need to understand how the transform pipeline works, debug a transformation issue, or make structural changes to the codemod itself. Explains visitor patterns, traces moment API call resolution through chain processing, and documents import rewriting logic
---

# Codemod Architecture

This skill is a reference document. Load it when you need to understand how the transform pipeline works, debug a transformation issue, or make structural changes to the codemod itself.

## Entry Point

`src/transform.ts` exports a default function matching jscodeshift's transform signature:

```ts
export default function transform(file: FileInfo, { j }: API, options: Options);
```

This function is invoked once per source file by the jscodeshift runner.

## Pipeline Overview

The transform processes a single file through these phases:

```
1. Parse source into AST
2. Find all moment() factory calls (tracing imports, aliases, reassignments)
3. For each invocation, build a call chain
4. Require at least one "breaking" call in the chain
5. Process the chain: parse -> [manipulate...] -> display
6. Replace AST nodes with Temporal equivalents
7. Add import declarations to top of file
8. Remove unused moment imports
9. Return transformed source
```

## Phase Details

### Finding Moment Calls (ast-utils.ts)

`findAllMomentFactoryCalls(source, j)` does the heavy lifting:

1. `findAllMomentDefaultSpecifiers` -- Finds all `import moment from "moment"` default specifiers.
2. For each specifier, traces all references through the scope, including:
   - Direct usage: `moment()`
   - Aliases: `const m = moment; m()`
   - Reassignments: `let x = moment; x = something; x()`
3. Filters to only `CallExpression` parents (actual invocations).

This is in `src/ast-utils.ts`. The `findAllReferences` function recursively follows aliases via `findReferenceAliases`.

### Building the Call Chain (transform.ts:46-60)

`invocationToChain(path, j)` walks up from a `moment()` call through parent `MemberExpression` + `CallExpression` pairs to build:

```ts
type CallChain = {
  init: ASTPath<CallExpression>; // The moment() call itself
  chains: ASTPath<CallExpression>[]; // Each subsequent .method() call, in order
};
```

For `moment().add(1, 'day').toDate()`, this produces:

- `init`: the `moment()` call
- `chains`: [`add(1, 'day')`, `toDate()`]

### Requiring a Breaking Call (transform.ts:85-92)

The pipeline scans the chain for at least one processor with `isBreaking: true`. If none is found, the entire chain is skipped and annotated with:

```
/* [from moment-to-temporal] only expressions that evaluate to a primitive or Date can be transformed. */
```

This is a fundamental design constraint: the codemod only transforms chains that produce a concrete non-Moment value, because it cannot safely replace a Moment object with a Temporal object in all contexts.

### Processing the Chain (transform.ts:75-115)

`processInvocation` orchestrates:

1. **Parse phase**: `processMomentFnCall(chain.init, imports, j)` (from `src/transformations/parse.ts`) converts the `moment()` factory call into a Temporal expression. Returns `null` if the arguments aren't supported.

2. **Chain processing**: Iterates through the sub-chain (up to and including the breaking call). For each chained method:
   - Looks up the method name in `chainProcessors` (the merged map from `display.ts` and `manipulate.ts`).
   - Calls `processor.process(path, currentExpression, imports, j)`.
   - Each processor returns a new expression that wraps/replaces the previous one.
   - If a processor returns `null`, the chain is aborted.
   - If a method has no registered processor, it's annotated as unsupported.

3. **Replacement**: If the entire chain succeeded, the outermost call expression is replaced with the final Temporal expression.

### The Chain Processor Map (transform.ts:36-39)

```ts
const chainProcessors: Partial<Record<string, ChainProcessor>> = {
  ...displayChainProcessors,
  ...manipulateChainProcessors,
};
```

This is a flat lookup by Moment.js method name. To add a new method, just add an entry to the appropriate `Record` in `display.ts` or `manipulate.ts` -- it gets picked up automatically.

### Parse Phase Details (transformations/parse.ts)

Handles three patterns:

| Moment.js                | Temporal replacement                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `moment()`               | `Temporal.Now.zonedDateTimeISO()`                                                     |
| `moment(number)`         | `new Temporal.ZonedDateTime(toEpochNanos(number), Temporal.Now.timeZoneId())`         |
| `moment(string, format)` | `new Temporal.ZonedDateTime(toEpochNanos(string, format), Temporal.Now.timeZoneId())` |

The `toEpochNanos` runtime utility handles the actual date string parsing at runtime.

### Import Management (transformations/imports.ts)

Each import factory is memoized with `lodash/once`:

```ts
export const toLegacyDateImport = once(
  (j) =>
    j.template
      .statement`import toLegacyDate from 'moment-to-temporal/runtime/to-legacy-date';`,
);
```

This ensures that even if multiple chains need `toLegacyDate`, only one import declaration is created. Processors push imports into a `pendingImports` array; these are only added to the file if the chain succeeds (`transform.ts:126-130`).

The `allImports` array and `importDependencyMap` support the CLI's post-transform reporting: the CLI reads a result file to tell users which npm packages to install.

### Annotation System (ast-utils.ts:101-108)

When a transformation cannot be performed:

```ts
annotatePath(path, 'the "quarter" method is not yet supported', j);
```

Produces: `/* [from moment-to-temporal] the "quarter" method is not yet supported. */`

The comment is attached to the AST node, so it appears inline in the output next to the untransformed code.

### Moment Import Cleanup (transform.ts:133-143)

After all invocations are processed, the transform checks if the `moment` default import specifier is still referenced. It removes unused references (including intermediate aliases via `removeUnusedReferences`) and, if no references remain, removes the entire `import moment from "moment"` declaration.

## CLI (bin/cli.cjs)

A CommonJS script that invokes jscodeshift's Runner API with the compiled `lib/transform.js`. It passes a `resultFilePath` option so the transform can write a JSON file listing which npm packages are needed. After the run, the CLI reads this file and prints install instructions.
