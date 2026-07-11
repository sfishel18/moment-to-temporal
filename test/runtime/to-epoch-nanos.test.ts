import { beforeEach, describe, expect, test, vi } from "vitest";
import moment from "moment";
import toEpochNanos from "../../src/runtime/to-epoch-nanos";

const nanosOf = (m: moment.Moment) => BigInt(m.valueOf()) * BigInt(1e6);

describe("toEpochNanos", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test("number input is treated as epoch milliseconds", () => {
    expect(toEpochNanos(1539688800000)).toBe(nanosOf(moment(1539688800000)));
  });

  test("no input means now", () => {
    // A timestamp whose nanosecond value is exactly representable as a
    // double — the runtime computes `BigInt(ms * 1e6)`, which above 2^53
    // rounds to the nearest representable float (±128ns around "now").
    vi.setSystemTime(1539688800000);
    expect(toEpochNanos()).toBe(BigInt(Date.now()) * BigInt(1e6));
  });

  test("ISO string without a format", () => {
    expect(toEpochNanos("2018-10-18T04:19:00")).toBe(
      nanosOf(moment("2018-10-18T04:19:00")),
    );
  });

  test("empty format array falls back to ISO parsing", () => {
    expect(toEpochNanos("2018-10-18T04:19:00", [])).toBe(
      nanosOf(moment("2018-10-18T04:19:00")),
    );
  });

  test("single format string", () => {
    expect(toEpochNanos("10/18/2018", "MM/DD/YYYY")).toBe(
      nanosOf(moment("10/18/2018", "MM/DD/YYYY")),
    );
  });

  test("format array where the first format wins", () => {
    expect(toEpochNanos("2018-10-18", ["YYYY-MM-DD", "MM/DD/YYYY"])).toBe(
      nanosOf(moment("2018-10-18", ["YYYY-MM-DD", "MM/DD/YYYY"])),
    );
  });

  test("format array where a later format wins", () => {
    expect(toEpochNanos("10/18/2018", ["YYYY-MM-DD", "MM/DD/YYYY"])).toBe(
      nanosOf(moment("10/18/2018", ["YYYY-MM-DD", "MM/DD/YYYY"])),
    );
  });

  test("unparseable input throws (known divergence from moment)", () => {
    // Moment produces an Invalid Date here; the runtime currently throws when
    // converting NaN to a BigInt. Tracked as an invalid-date-handling gap —
    // see the `.isValid()` item in ROADMAP.md. This test pins the current
    // behavior so a change is deliberate.
    expect(() => toEpochNanos("not a date", "YYYY-MM-DD")).toThrow(RangeError);
    expect(() => toEpochNanos("not a date")).toThrow(RangeError);
  });
});
