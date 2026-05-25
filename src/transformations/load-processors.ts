import fs from "fs";
import path from "path";

/**
 * Load all processor files from the `processors/` directory. Each file
 * calls `register()` as a side effect, populating the registry. This must
 * be called once before any transform invocations.
 *
 * Uses `fs.readdirSync` rather than `glob` to avoid compatibility issues
 * with Babel's transpilation of glob's private class methods during test runs.
 */
export function loadAllProcessors(): void {
  const processorsDir = path.join(__dirname, "processors");
  const entries = fs.readdirSync(processorsDir);
  const files = entries
    .filter((f) => f.endsWith(".js") || f.endsWith(".ts"))
    .map((f) => path.join(processorsDir, f));
  for (const file of files) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require(file);
  }
}
