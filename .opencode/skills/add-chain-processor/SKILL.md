---
name: add-chain-processor
description: Step-by-step guide for adding support for a new Moment.js method to the codemod transform pipeline. Use when the user needs to add a new Moment.js method transformation to the codemod pipeline, or asks about extending codemod support for additional Moment.js APIs.
---

# Adding a New Chain Processor

A ChainProcessor handles one Moment.js chained method (e.g., `.valueOf()`, `.unix()`, `.clone()`). This skill walks through every file you need to touch.

## 1. Understand the ChainProcessor Interface

Defined in `src/types.ts`:

```ts
type ChainProcessor = {
  isBreaking?: boolean;
  process: (
    path: ASTPath<CallExpression>, // AST node of the chained call
    next: ExpressionObject, // The Temporal expression built so far
    imports: ImportDeclaration[], // Push any needed import declarations here
    j: JSCodeshift, // jscodeshift API
  ) => ExpressionObject | null; // Return new expression, or null to abort
};
```

**`isBreaking`**: Set to `true` if this method produces a non-Moment value (a primitive, Date, etc.). The transform pipeline _requires_ at least one breaking call in the chain to proceed. Methods like `toDate`, `toISOString`, `format` are breaking. Methods like `add`, `subtract`, `startOf` are not -- they return a Moment/Temporal and allow further chaining.

**Return value**: Return a new AST expression to replace the chain so far, or `null` to indicate failure. When returning `null`, always call `annotatePath()` first to explain why.

## 2. Decide Where to Put It

Processors are grouped by category. Add yours to one of:

- **`src/transformations/display.ts`** -- Methods that produce a final value (`isBreaking: true`). Examples: `toDate`, `toISOString`, `format`, `valueOf`, `unix`.
- **`src/transformations/manipulate.ts`** -- Methods that return a modified Temporal object (chainable, not breaking). Examples: `add`, `subtract`, `startOf`, `endOf`, `clone`, `utc`.

Both files export a `Record<string, ChainProcessor>`. The key is the Moment.js method name (e.g., `"valueOf"`). These records are spread into a single map in `src/transform.ts:36-39` -- no changes needed there.

## 3. Write the Processor

### Template for a Breaking Processor (display.ts)

```ts
methodName: {
  isBreaking: true,
  process: (path, next, imports, j) => {
    const callee = path.node.callee;
    if (!j.MemberExpression.check(callee)) {
      annotatePath(
        path,
        `failed to transform \`methodName\`: not called as a member function`,
        j,
      );
      return null;
    }
    // If you need a runtime utility, push its import:
    // imports.push(myUtilImport(j));

    // Build the replacement AST expression.
    // `next` is the Temporal expression from earlier in the chain.
    return j.template.expression`someTemporalExpression(${next})`;
  },
},
```

### Template for a Non-Breaking Processor (manipulate.ts)

```ts
methodName: {
  process: (path, next, _, j) => {
    const callee = path.node.callee;
    if (!j.MemberExpression.check(callee)) {
      annotatePath(
        path,
        `failed to transform \`methodName\`: not called as a member function`,
        j,
      );
      return null;
    }
    // Access arguments: path.node.arguments
    // Build the replacement, threading `next` through:
    return j.template.expression`${next}.someMethod(args)`;
  },
},
```

### Key Patterns

- **Accessing arguments**: `path.node.arguments` is the array of AST argument nodes.
- **Building AST expressions**: Use `j.template.expression` with tagged template literals. Interpolate AST nodes directly (e.g., `` j.template.expression`${next}.add(${durationObj})` ``).
- **Annotation on failure**: Always call `annotatePath(path, 'reason', j)` before returning `null`. This inserts a `/* [from moment-to-temporal] reason. */` comment in the output so users know what wasn't transformed.
- **Accessing the callee**: The `path.node.callee` check for `MemberExpression` is a standard guard -- always include it.

## 4. Add Runtime Utilities (If Needed)

If your Temporal replacement needs a runtime helper function, load the `add-runtime-utility` skill for that workflow.

## 5. Write Tests

Load the `write-test-cases` skill for the test file conventions. At minimum, create:

- A test case file in the appropriate `test/cases/` subdirectory with exported functions exercising the method.
- A negative-case file if there are unsupported argument patterns.

## 6. Verify

```sh
pnpm test
pnpm run build
```

Both must pass. The build compiles to `lib/` and is what gets published to npm.

## Concrete Example: The `toDate` Processor

In `src/transformations/display.ts:6-20`:

```ts
toDate: {
  isBreaking: true,
  process: (path, next, imports, j) => {
    const callee = path.node.callee;
    if (!j.MemberExpression.check(callee)) {
      annotatePath(path, `failed to transform \`toDate\`: ...`, j);
      return null;
    }
    imports.push(toLegacyDateImport(j));
    return j.template.expression`toLegacyDate(${next})`;
  },
},
```

This transforms `moment().toDate()` into `toLegacyDate(Temporal.Now.zonedDateTimeISO())`. It pushes the `toLegacyDateImport` so the output file gets `import toLegacyDate from 'moment-to-temporal/runtime/to-legacy-date'`.
