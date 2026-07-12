import { Temporal } from "@js-temporal/polyfill";
import moment from "moment";
import { describe, expect, test } from "vitest";
import diff from "../../src/runtime/diff";

const zdtOf = (m: moment.Moment): Temporal.ZonedDateTime =>
  Temporal.Instant.fromEpochMilliseconds(m.valueOf()).toZonedDateTimeISO(
    Temporal.Now.timeZoneId(),
  );

describe("diff", () => {
  test("defaults to milliseconds", () => {
    const a = moment("2020-03-01T06:30:00");
    const b = new Date(2020, 1, 15);
    expect(diff(zdtOf(a), b)).toBe(a.diff(b));
  });

  test("accepts epoch milliseconds as the other side", () => {
    const a = moment("2020-01-02T00:00:00");
    expect(diff(zdtOf(a), 1577950000000, "seconds")).toBe(
      a.diff(1577950000000, "seconds"),
    );
  });

  test("accepts a Temporal.ZonedDateTime as the other side", () => {
    const a = moment("2020-03-01T06:30:00");
    const b = moment("2020-02-15T00:00:00");
    expect(diff(zdtOf(a), zdtOf(b), "days")).toBe(a.diff(b, "days"));
  });

  test("accepts a Moment as the other side", () => {
    const a = moment("2020-03-01T00:00:00");
    const b = moment("2020-02-01T00:00:00");
    expect(diff(zdtOf(a), b, "months")).toBe(a.diff(b, "months"));
  });

  test.each(["seconds", "minutes", "hours", "days", "weeks"] as const)(
    "matches moment for the %s unit",
    (unit) => {
      const a = moment("2020-02-20T18:45:30");
      const b = new Date(2020, 0, 15, 6, 10, 5);
      expect(diff(zdtOf(a), b, unit)).toBe(a.diff(b, unit));
    },
  );

  test("matches moment for the months unit", () => {
    const a = moment("2020-05-15T00:00:00");
    const b = new Date(2020, 0, 15);
    expect(diff(zdtOf(a), b, "months")).toBe(a.diff(b, "months"));
  });

  test("matches moment for the years unit", () => {
    const a = moment("2023-07-01T00:00:00");
    const b = new Date(2020, 6, 1);
    expect(diff(zdtOf(a), b, "years")).toBe(a.diff(b, "years"));
  });

  test("returns the exact fraction when asFloat is true", () => {
    const a = moment("2020-01-02T03:30:00");
    const b = new Date(2020, 0, 1);
    expect(diff(zdtOf(a), b, "hours", true)).toBe(27.5);
  });

  test("truncates toward zero for negative diffs", () => {
    const a = moment("2020-01-01T00:00:00");
    const b = new Date(2020, 0, 2, 12);
    expect(diff(zdtOf(a), b, "days")).toBe(-1);
  });

  test("normalizes -0 to positive zero like moment", () => {
    const a = moment("2020-01-01T00:00:00");
    const b = new Date(2020, 0, 1, 12);
    const result = diff(zdtOf(a), b, "days");
    expect(Object.is(result, 0)).toBe(true);
  });
});
