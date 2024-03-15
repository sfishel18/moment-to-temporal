import { type Temporal } from "@js-temporal/polyfill";

export default (dateTime: Temporal.ZonedDateTime): Date =>
  new Date(dateTime.toInstant().epochMilliseconds);
