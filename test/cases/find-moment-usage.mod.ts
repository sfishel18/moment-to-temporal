import { Temporal } from "@js-temporal/polyfill";
import toLegacyDate from "moment-to-temporal/runtime/to-legacy-date";
import moment from "moment";

export const directUsage = () => {
  return toLegacyDate(Temporal.Now.zonedDateTimeISO()).toISOString();
};

export const indirectUsageSameScope = () => {
  const mmt = moment;
  return mmt().toDate().toISOString();
};

export const expectNoMoment = true;
