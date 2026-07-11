import { globSync } from "glob";
import { join, relative } from "path";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { readFileSync, writeFileSync } from "fs";
import { isFunction } from "lodash";
import jscodeshift, { API } from "jscodeshift";
import transform from "../src/transform";

const j = jscodeshift.withParser("ts");
const api: API = {
  j,
  jscodeshift: j,
  stats: () => {},
  report: () => {},
};

describe("all cases", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const allFiles = globSync(join(__dirname, "cases/**/*.{js,ts}")).filter(
    (file) => !file.endsWith(".mod.js") && !file.endsWith(".mod.ts"),
  );
  const onlyFiles = allFiles.filter(
    (file) => file.endsWith(".only.js") || file.endsWith(".only.ts"),
  );
  const files = onlyFiles.length > 0 ? onlyFiles : allFiles;
  for (let file of files) {
    describe(relative(`${__dirname}/cases`, file), async () => {
      // Include the pid so concurrent test processes (e.g. Stryker workers
      // sharing a sandbox) don't race on the same output files.
      const modFile = file
        .replace(/.js$/, `.pid${process.pid}.mod.js`)
        .replace(/.ts$/, `.pid${process.pid}.mod.ts`);
      const expected = await import(file);
      let actual: Record<string, unknown>;
      beforeAll(async () => {
        const source = readFileSync(file, { encoding: "utf-8" });
        writeFileSync(modFile, transform({ source, path: modFile }, api, {}));
        // Cache-bust the import: Stryker's vitest runner disables test
        // isolation, so without this a rerun would get the module cached from
        // a previous mutant run instead of the freshly written output.
        // (Math.random rather than Date.now because fake timers freeze Date.)
        actual = await import(`${modFile}?v=${Math.random().toString(36).slice(2)}`);
      });
      Object.keys(expected).forEach((key) => {
        if (isFunction(expected[key])) {
          test(key, () => {
            expect(expected[key]()).toEqual(
              (actual[key] as () => unknown)(),
            );
          });
        }
      });
      if (expected.expectNoMoment) {
        test("moment import removed", () => {
          const actualSource = readFileSync(modFile, { encoding: "utf-8" });
          expect(actualSource).not.toMatch(/import .* from "moment";/);
        });
      }
    });
  }
});
