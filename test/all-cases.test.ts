import { globSync } from "glob";
import { join, relative } from "path";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { copyFileSync, readFileSync } from "fs";
import { execSync } from "child_process";
import { isFunction } from "lodash";

describe("all cases", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const allFiles = globSync(join(__dirname, "cases/**/*.{js,ts}")).filter(
    (file) => !file.endsWith(".mod.js") && !file.endsWith(".mod.ts")
  );
  const onlyFiles = allFiles.filter(
    (file) => file.endsWith(".only.js") || file.endsWith(".only.ts")
  );
  const files = onlyFiles.length > 0 ? onlyFiles : allFiles;
  for (let file of files) {
    describe(relative(`${__dirname}/cases`, file), async () => {
      const modFile = file
        .replace(/.js$/, ".mod.js")
        .replace(/.ts$/, ".mod.ts");
      copyFileSync(file, modFile);
      execSync(
        `${join(__dirname, "../node_modules/.bin/hypermod")} -p ts -t ${join(
          __dirname,
          "../src/transform.ts"
        )} ${modFile}`
      );
      const expected = await import(file);
      const actual = await import(modFile);
      Object.keys(expected).forEach((key) => {
        if (isFunction(expected[key])) {
          test(key, () => {
            expect(expected[key]()).toEqual(actual[key]());
          });
        }
      });
      if (expected.expectNoMoment) {
        const actualSource = readFileSync(modFile, { encoding: "utf-8" });
        test("moment import removed", () => {
          expect(actualSource).not.toMatch(/import .* from "moment";/);
        });
      }
    });
  }
});
