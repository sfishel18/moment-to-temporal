import { Temporal } from '@js-temporal/polyfill';import toLegacyDate from 'moment-to-temporal/runtime/to-legacy-date';

export const one = (): string => {
  return toLegacyDate(Temporal.Now.zonedDateTimeISO()).toISOString();
};

export const two = (): string => {
  return toLegacyDate(Temporal.Now.zonedDateTimeISO().add({ "minutes": 1 })).toISOString();
};

export const expectNoMoment = true;
