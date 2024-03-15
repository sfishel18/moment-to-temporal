import { Temporal, toTemporalInstant } from "@js-temporal/polyfill";
import { parse } from "date-fns/parse";
import InvalidZonedDateTime from "./InvalidZonedDateTime";

const mapFormatString = (format: string): string =>
  format
    .split(/\[\]/)
    .map((part, i) =>
      i % 2 === 1 ? part : part.replace(/D/g, "d").replace(/YY/g, "yy")
    )
    .join("'");

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

const fromLegacyDate = (date: Date): Temporal.ZonedDateTime =>
  isValidDate(date)
    ? toTemporalInstant.call(date).toZonedDateTimeISO(Temporal.Now.timeZoneId())
    : InvalidZonedDateTime;

export default (
  dateString: string,
  formats: string[]
): Temporal.ZonedDateTime => {
  debugger;
  let date: Date = new Date(Number.NaN);
  for (let format of formats) {
    date = parse(dateString, mapFormatString(format), new Date());
    if (isValidDate(date)) {
      break;
    }
  }
  return fromLegacyDate(date);
};
