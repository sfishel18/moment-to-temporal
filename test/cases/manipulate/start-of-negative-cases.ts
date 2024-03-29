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
