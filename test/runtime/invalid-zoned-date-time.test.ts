import { describe, expect, test } from "vitest";
import InvalidZonedDateTime from "../../src/runtime/InvalidZonedDateTime";

// The invalid-date sentinel is a self-referential object graph in which every
// reachable field and zero-argument method result must signal invalidity.
// Rather than pinning each of the ~150 fields individually, walk the graph
// and enforce the invariant per type. Fields whose "invalid" value is not the
// type default are pinned explicitly.
const FIELD_EXCEPTIONS: Record<string, unknown> = {
  // An invalid duration is sign 0 and blank
  sign: 0,
  blank: true,
};

const check = (value: unknown, path: string, visited: Set<object>): void => {
  if (value === null) {
    // e.g. dateFromFields — no meaningful invalid value exists
    return;
  }
  switch (typeof value) {
    case "number":
      expect(value, path).toBeNaN();
      break;
    case "string":
      expect(value, path).toMatch(/^$|^Invalid /);
      break;
    case "boolean":
      expect(value, path).toBe(false);
      break;
    case "bigint":
      expect(value, path).toBe(BigInt(0));
      break;
    case "function": {
      const result = (value as () => unknown)();
      if (path.endsWith(".toJSON")) {
        // toJSON must produce a recognizable invalid marker, not just any
        // string the generic string rule would accept.
        expect(result, `${path}()`).toMatch(/^Invalid /);
        break;
      }
      check(result, `${path}()`, visited);
      break;
    }
    case "object": {
      const obj = value as Record<string, unknown>;
      if (visited.has(obj)) {
        return;
      }
      visited.add(obj);
      if (Array.isArray(obj)) {
        expect(obj, path).toEqual([]);
        return;
      }
      const tag = (obj as Record<PropertyKey, unknown>)[Symbol.toStringTag];
      if (tag !== undefined) {
        expect(tag, `${path}[Symbol.toStringTag]`).toMatch(/^Temporal\./);
      }
      // Every invalid object carries fields — an empty object would satisfy
      // the per-field checks vacuously. (mergeFields legitimately returns {}.)
      if (!path.endsWith("mergeFields()")) {
        expect(Object.keys(obj).length, path).toBeGreaterThan(0);
      }
      for (const [key, propValue] of Object.entries(obj)) {
        if (Object.prototype.hasOwnProperty.call(FIELD_EXCEPTIONS, key)) {
          expect(propValue, `${path}.${key}`).toBe(FIELD_EXCEPTIONS[key]);
          continue;
        }
        if (key === "valueOf" && propValue === undefined) {
          // deliberately `undefined as never` to break implicit coercion
          continue;
        }
        check(propValue, `${path}.${key}`, visited);
      }
      break;
    }
    default:
      throw new Error(`unexpected ${typeof value} at ${path}`);
  }
};

describe("InvalidZonedDateTime", () => {
  test("every reachable field and method result signals invalidity", () => {
    check(InvalidZonedDateTime, "InvalidZonedDateTime", new Set());
  });
});
