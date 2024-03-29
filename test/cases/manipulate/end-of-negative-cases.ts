import moment from "moment";

export const endOfWeek = (): string => {
  return moment().endOf("week").toDate().toISOString();
};

export const endOfIsoWeek = (): string => {
  return moment().endOf("isoWeek").toDate().toISOString();
};

export const endOfMonth = (): string => {
  return moment().endOf("month").toDate().toISOString();
};

export const endOfQuarter = (): string => {
  return moment().endOf("quarter").toDate().toISOString();
};

export const endOfYear = (): string => {
  return moment().endOf("year").toDate().toISOString();
};
