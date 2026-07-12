import moment from "moment";

export const cloneBeforeBreaker = (): string => {
  return moment().clone().toDate().toISOString();
};

export const cloneBetweenManipulations = (): number => {
  return moment().add(1, "day").clone().subtract(2, "hours").valueOf();
};

export const cloneInsideUnaryPlus = (): number => {
  return +moment().clone();
};

export const cloneOfParsedString = (): string => {
  return moment("2018-10-18T04:19:00").clone().toISOString();
};

export const expectNoMoment = true;
