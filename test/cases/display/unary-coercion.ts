import moment from "moment";

export const basicUnaryPlus = (): number => {
  return +moment();
};

export const unaryWithAdd = (): number => {
  return +moment().add(5, "days");
};

export const unaryWithSubtract = (): number => {
  return +moment().subtract(2, "hours");
};

export const unaryWithValueOf = (): number => {
  return +moment().valueOf();
};

export const unaryWithMidChainBreak = (): number => {
  return +moment().valueOf().toString().slice(0, 3);
};

export const expectNoMoment = true;
