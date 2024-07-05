import { Temporal, toTemporalInstant } from "@js-temporal/polyfill";
import { parse } from "date-fns/parse";
import InvalidZonedDateTime from "./InvalidZonedDateTime";
import { mapFormatString } from "./formatting-utils";
import { parseISO } from "date-fns";

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

const fromLegacyDate = (date: Date): Temporal.ZonedDateTime =>
  isValidDate(date)
    ? toTemporalInstant.call(date).toZonedDateTimeISO(Temporal.Now.timeZoneId())
    : InvalidZonedDateTime;

export default (
  dateString: string,
  formats?: string[],
): Temporal.ZonedDateTime => {
  if (!formats || formats.length === 0) {
    return fromLegacyDate(parseISO(dateString));
  }
  let date: Date = new Date(Number.NaN);
  for (let format of formats) {
    date = parse(dateString, mapFormatString(format), new Date());
    if (isValidDate(date)) {
      break;
    }
  }
  return fromLegacyDate(date);
};
