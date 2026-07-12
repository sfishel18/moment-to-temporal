import { type Temporal } from "@js-temporal/polyfill";

// The `other` side of a diff may not have been co-transformed: it can be a
// Temporal ZonedDateTime, a legacy Date, epoch milliseconds, or a leftover
// Moment (which coerces to epoch milliseconds via valueOf).
type DateLike = Temporal.ZonedDateTime | Date | number | { valueOf(): number };

const toEpochMilliseconds = (value: DateLike): number =>
  typeof value === "object" && "epochMilliseconds" in value
    ? value.epochMilliseconds
    : Number(value);

export default (
  dateTime: Temporal.ZonedDateTime,
  other: DateLike,
  unit: Temporal.PluralUnit<Temporal.DateTimeUnit> = "milliseconds",
  asFloat = false,
): number => {
  // Re-anchor `other` at its instant in dateTime's time zone using exact-time
  // arithmetic on the receiver, so the Temporal runtime is never needed here.
  const otherDateTime = dateTime.add({
    milliseconds: toEpochMilliseconds(other) - dateTime.epochMilliseconds,
  });
  const total = dateTime
    .since(otherDateTime)
    .total({ unit, relativeTo: otherDateTime });
  // Moment truncates toward zero and normalizes -0 to 0.
  return asFloat ? total : Math.trunc(total) || 0;
};
