import moment from "moment";

export const basicToJSON = (): string => {
  return moment().toJSON();
};

export const toJSONAfterChain = (): string => {
  return moment().add(3, "hours").subtract(45, "seconds").toJSON();
};

export const toJSONOfParsedString = (): string => {
  // Fractional milliseconds: exercises the trailing-zero padding.
  return moment("2018-10-18T04:19:00.120").toJSON();
};

export const toJSONInsideStringify = (): string => {
  return JSON.stringify({ at: moment("2018-10-18T04:19:00").toJSON() });
};

export const expectNoMoment = true;
