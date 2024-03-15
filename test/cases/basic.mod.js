import { Temporal } from '@js-temporal/polyfill';import toLegacyDate from 'moment-to-temporal/runtime/to-legacy-date';import fromString from 'moment-to-temporal/runtime/from-string';

export const one = () => {
  return toLegacyDate(Temporal.Now.zonedDateTimeISO()).toISOString();
};

export const two = () => {
  return toLegacyDate(Temporal.Now.zonedDateTimeISO().add({ "minutes": 1 })).toISOString();
};

export const three = () => {
  return toLegacyDate(fromString("2018", ["YYYY"])).toISOString();
};

export const expectNoMoment = true;
