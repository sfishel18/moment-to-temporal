import moment from "moment";

export const startOfSecond = (): string => {
  return moment().startOf("second").toDate().toISOString();
};

export const startOfMinute = (): string => {
  return moment().startOf("minute").toDate().toISOString();
};

export const startOfHour = (): string => {
  return moment().startOf("hour").toDate().toISOString();
};

export const startOfDay = (): string => {
  return moment().startOf("day").toDate().toISOString();
};

export const startOfDate = (): string => {
  return moment().startOf("date").toDate().toISOString();
};

export const expectNoMoment = true;
