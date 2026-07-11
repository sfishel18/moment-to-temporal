import { globSync } from "glob";
import { join, relative } from "path";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { readFileSync, rmSync, writeFileSync } from "fs";
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
      const expected = await import(file);
      // Every test runs the transform itself, inside the test body. This is
      // deliberate and load-bearing for mutation testing:
      // 1. Stryker's per-test coverage only credits tests that *execute*
      //    mutated code. If the transform ran once in a shared hook, the
      //    tests that assert on its output would not be in any mutant's
      //    covering set, and Stryker's filtered mutant runs would skip them,
      //    letting mutants falsely survive.
      // 2. The output path is unique per invocation: the pid segment stops
      //    concurrent Stryker workers (which share one sandbox) racing on the
      //    same files, and the random segment defeats the module cache that
      //    Stryker's isolation-free reruns would otherwise serve stale
      //    modules from. (A `?v=` query suffix is NOT sufficient — it gets
      //    normalized away.)
      const withTransformed = async (
        fn: (result: { modFile: string; output: string }) => Promise<void>,
      ) => {
        const token = `pid${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
        const modFile = file
          .replace(/.js$/, `.${token}.mod.js`)
          .replace(/.ts$/, `.${token}.mod.ts`);
        const source = readFileSync(file, { encoding: "utf-8" });
        const output = transform({ source, path: modFile }, api, {});
        writeFileSync(modFile, output);
        try {
          await fn({ modFile, output });
        } finally {
          rmSync(modFile, { force: true });
        }
      };
      Object.keys(expected).forEach((key) => {
        if (isFunction(expected[key])) {
          test(key, async () => {
            await withTransformed(async ({ modFile }) => {
              const actual: Record<string, unknown> = await import(modFile);
              expect(expected[key]()).toEqual(
                (actual[key] as () => unknown)(),
              );
            });
          });
        }
      });
      if (expected.expectNoMoment === true) {
        test("moment import removed", async () => {
          await withTransformed(async ({ output }) => {
            expect(output).not.toMatch(/import .* from "moment";/);
          });
        });
      }
      if (expected.expectNoMoment === false) {
        // Negative cases must NOT be transformed — assert the moment import
        // is still present so a transform that wrongly "succeeds" fails here.
        test("moment import kept", async () => {
          await withTransformed(async ({ output }) => {
            expect(output).toMatch(/import .* from "moment";/);
          });
        });
      }
    });
  }
});
