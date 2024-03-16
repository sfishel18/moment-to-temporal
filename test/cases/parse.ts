import moment from "moment";

export const noArguments = (): string => {
  return moment().toDate().toISOString();
};

export const yearFormat = () => {
  return moment("2018", ["YYYY"]).toDate().toISOString();
};

export const expectNoMoment = true;
