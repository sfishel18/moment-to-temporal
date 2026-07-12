import { type Temporal } from "@js-temporal/polyfill";
import { format } from "date-fns/format";

// Moment's .toString() always uses the English locale and the fixed shape
// "Sat Jul 12 2026 10:00:00 GMT-0700" (format "ddd MMM DD YYYY HH:mm:ss
// [GMT]ZZ"), regardless of any global locale configuration.
export default (dateTime: Temporal.ZonedDateTime): string =>
  format(dateTime.epochMilliseconds, "EEE MMM dd yyyy HH:mm:ss 'GMT'xx");
