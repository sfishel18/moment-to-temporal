import { Temporal } from "@js-temporal/polyfill";
import moment from "moment";
import { describe, expect, test } from "vitest";
import toMomentString from "../../src/runtime/to-moment-string";

const zdtOf = (m: moment.Moment): Temporal.ZonedDateTime =>
  Temporal.Instant.fromEpochMilliseconds(m.valueOf()).toZonedDateTimeISO(
    Temporal.Now.timeZoneId(),
  );

describe("toMomentString", () => {
  // A spread of dates covering every month, every weekday, single- and
  // double-digit day/hour/minute/second, AM and PM, and both DST phases.
  const inputs = [
    "2019-01-06T00:00:00",
    "2019-02-04T01:01:01",
    "2019-03-05T04:08:09",
    "2019-04-03T09:59:59",
    "2019-05-09T12:00:00",
    "2019-06-07T13:30:45",
    "2019-07-06T18:05:00",
    "2019-08-11T23:59:59",
    "2019-09-02T06:15:30",
    "2019-10-15T10:10:10",
    "2019-11-20T20:20:20",
    "2019-12-31T22:04:06",
  ];

  for (const input of inputs) {
    test(`matches moment's .toString() for ${input}`, () => {
      const m = moment(input);
      expect(toMomentString(zdtOf(m))).toBe(m.toString());
    });
  }
});
