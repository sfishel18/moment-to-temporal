import moment from "moment";

export const basicValueOf = (): number => {
  return moment().valueOf();
};

export const valueOfAfterChain = (): number => {
  return moment().add(5, "days").subtract(2, "hours").valueOf();
};

export const expectNoMoment = true;
