import { describe, expect, test } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import jscodeshift, { API } from "jscodeshift";
import transform from "../../src/transform";

const j = jscodeshift.withParser("ts");
const api: API = {
  j,
  jscodeshift: j,
  stats: () => {},
  report: () => {},
};

// The CLI (bin/cli.cjs) passes `resultFilePath` so it can report which npm
// packages the transformed code now depends on.
const runTransform = (source: string) => {
  const dir = mkdtempSync(join(tmpdir(), "m2t-result-"));
  const resultFilePath = join(dir, "result.json");
  try {
    transform({ source, path: "input.ts" }, api, { resultFilePath });
    const result: { importsAdded: string[] } = JSON.parse(
      readFileSync(resultFilePath, { encoding: "utf-8" }),
    );
    return result;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

describe("resultFilePath reporting", () => {
  test("chain with a runtime helper reports polyfill + runtime deps", () => {
    const { importsAdded } = runTransform(
      `import moment from "moment";
export const f = () => moment().toDate();`,
    );
    expect(importsAdded.sort()).toEqual([
      "@js-temporal/polyfill",
      "moment-to-temporal",
    ]);
  });

  test("string-parsing chain reports the toEpochNanos runtime dep", () => {
    // moment(string) emits toEpochNanos — the only runtime helper here, so
    // the "moment-to-temporal" dep must come from its dependency-map entry.
    const { importsAdded } = runTransform(
      `import moment from "moment";
export const f = () => moment("2018-10-18").valueOf();`,
    );
    expect(importsAdded.sort()).toEqual([
      "@js-temporal/polyfill",
      "moment-to-temporal",
    ]);
  });

  test("format chain reports the toFormattedString runtime dep", () => {
    const { importsAdded } = runTransform(
      `import moment from "moment";
export const f = () => moment().format("YYYY");`,
    );
    expect(importsAdded.sort()).toEqual([
      "@js-temporal/polyfill",
      "moment-to-temporal",
    ]);
  });

  test("toString chain reports the toMomentString runtime dep", () => {
    const { importsAdded } = runTransform(
      `import moment from "moment";
export const f = () => moment().toString();`,
    );
    expect(importsAdded.sort()).toEqual([
      "@js-temporal/polyfill",
      "moment-to-temporal",
    ]);
  });

  test("chain without runtime helpers reports only the polyfill", () => {
    const { importsAdded } = runTransform(
      `import moment from "moment";
export const f = () => moment().valueOf();`,
    );
    expect(importsAdded).toEqual(["@js-temporal/polyfill"]);
  });

  test("file without moment usage reports no deps", () => {
    const { importsAdded } = runTransform(`export const f = () => 1;`);
    expect(importsAdded).toEqual([]);
  });

  test("no result file is written when the option is absent", () => {
    const dir = mkdtempSync(join(tmpdir(), "m2t-result-"));
    const resultFilePath = join(dir, "result.json");
    try {
      transform(
        { source: `export const f = () => 1;`, path: "input.ts" },
        api,
        {},
      );
      expect(existsSync(resultFilePath)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
