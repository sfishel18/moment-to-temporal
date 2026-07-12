import moment from "moment";

export const basicToString = (): string => {
  return moment().toString();
};

export const toStringAfterChain = (): string => {
  return moment().add(2, "months").subtract(30, "minutes").toString();
};

export const toStringOfParsedString = (): string => {
  // Single-digit day and hour: exercises zero padding.
  return moment("2019-03-05T04:08:09").toString();
};

export const expectNoMoment = true;
