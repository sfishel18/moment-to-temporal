import moment from "moment";

export const one = (): string => {
  return moment().toDate().toISOString();
};

export const two = (): string => {
  return moment().add(1, "minutes").toDate().toISOString();
};

export const expectNoMoment = true;
