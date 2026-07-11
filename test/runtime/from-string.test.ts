import { beforeEach, describe, expect, test, vi } from "vitest";
import moment from "moment";
import { type Temporal } from "@js-temporal/polyfill";
import fromString from "../../src/runtime/from-string";
import InvalidZonedDateTime from "../../src/runtime/InvalidZonedDateTime";

const expectSameInstant = (
  actual: Temporal.ZonedDateTime,
  expected: moment.Moment,
) => {
  expect(actual.epochMilliseconds).toBe(expected.valueOf());
};

describe("fromString", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test("ISO string without a format", () => {
    expectSameInstant(
      fromString("2018-10-18T04:19:00"),
      moment("2018-10-18T04:19:00"),
    );
  });

  test("single format string", () => {
    expectSameInstant(
      fromString("10/18/2018", "MM/DD/YYYY"),
      moment("10/18/2018", "MM/DD/YYYY"),
    );
  });

  test("empty format array falls back to ISO parsing", () => {
    expectSameInstant(
      fromString("2018-10-18T04:19:00", []),
      moment("2018-10-18T04:19:00"),
    );
  });

  test("format array where the first format wins", () => {
    expectSameInstant(
      fromString("2018-10-18", ["YYYY-MM-DD", "MM/DD/YYYY"]),
      moment("2018-10-18", ["YYYY-MM-DD", "MM/DD/YYYY"]),
    );
  });

  test("format array where a later format wins", () => {
    expectSameInstant(
      fromString("10/18/2018", ["YYYY-MM-DD", "MM/DD/YYYY"]),
      moment("10/18/2018", ["YYYY-MM-DD", "MM/DD/YYYY"]),
    );
  });

  test("unparseable input with formats returns the invalid sentinel", () => {
    const result = fromString("not a date", ["YYYY-MM-DD", "MM/DD/YYYY"]);
    expect(result).toBe(InvalidZonedDateTime);
    expect(Number.isNaN(result.epochMilliseconds)).toBe(true);
  });

  test("unparseable ISO input returns the invalid sentinel", () => {
    expect(fromString("not a date")).toBe(InvalidZonedDateTime);
  });
});
