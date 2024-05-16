import { Temporal } from "@js-temporal/polyfill";
import { format } from "date-fns/format";
import { mapFormatString } from "./formatting-utils";

export default (zdt: Temporal.ZonedDateTime, fmt: string) =>
  format(zdt.epochMilliseconds, mapFormatString(fmt));
