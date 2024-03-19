import moment from "moment";

export const noArguments = (): string => {
  return moment().toDate().toISOString();
};

export const yearFormat = () => {
  return moment("2018", ["YYYY"]).toDate().toISOString();
};

export const yearMonthDayFormat = () => {
  return moment("2018-10-18", ["YYYY-MM-DD"]).toDate().toISOString();
};

export const expectNoMoment = true;
