import moment from "moment";

export const startOfWeek = (): string => {
  return moment().startOf("week").toDate().toISOString();
};

export const startOfIsoWeek = (): string => {
  return moment().startOf("isoWeek").toDate().toISOString();
};

export const startOfMonth = (): string => {
  return moment().startOf("month").toDate().toISOString();
};

export const startOfQuarter = (): string => {
  return moment().startOf("quarter").toDate().toISOString();
};

export const startOfYear = (): string => {
  return moment().startOf("year").toDate().toISOString();
};

export const expectNoMoment = false;

export const expectedAnnotations = [
  'failed to transform `startOf`: unit "weeks" does not support rounding',
  'failed to transform `startOf`: unit "isoWeek" is not recognized',
  'failed to transform `startOf`: unit "months" does not support rounding',
  'failed to transform `startOf`: unit "quarter" is not recognized',
  'failed to transform `startOf`: unit "years" does not support rounding',
];
