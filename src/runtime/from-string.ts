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
  formatOrFormats?: string | string[],
): Temporal.ZonedDateTime => {
  const formatArray: string[] | undefined = typeof formatOrFormats === 'string' ? [formatOrFormats] : formatOrFormats
  if (!formatArray || formatArray.length === 0) {
    return fromLegacyDate(parseISO(dateString));
  }
  let date: Date = new Date(Number.NaN);
  for (let format of formatArray) {
    date = parse(dateString, mapFormatString(format), new Date());
    if (isValidDate(date)) {
      break;
    }
  }
  return fromLegacyDate(date);
};
