import moment from "moment";

export const endOfSecond = (): string => {
  return moment().endOf("second").toDate().toISOString();
};

export const endOfMinute = (): string => {
  return moment().endOf("minute").toDate().toISOString();
};

export const endOfHour = (): string => {
  return moment().endOf("hour").toDate().toISOString();
};

export const endOfDay = (): string => {
  return moment().endOf("day").toDate().toISOString();
};

export const endOfDate = (): string => {
  return moment().endOf("date").toDate().toISOString();
};

export const expectNoMoment = true;
