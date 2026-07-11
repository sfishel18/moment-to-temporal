import moment from "moment";

// Chain shapes that exercise the transform's dispatch edge cases: breaking
// call followed by plain JS calls, unary plus around them, and moment(...)
// parsed with a format inside a unary chain.

export const unaryPlusThenPostBreakerCalls = (): number => {
  return +moment().toDate().getTime();
};

export const breakerThenPostBreakerCalls = (): string => {
  return moment().toDate().getTime().toString();
};

export const unaryPlusWithParsedDate = (): number => {
  return +moment("2018-10-18", "YYYY-MM-DD").add(1, "day");
};

export const unaryPlusValueOfThenFormat = (): number => {
  return +moment("2018-10-18", "YYYY-MM-DD").valueOf().toFixed(0);
};

export const expectNoMoment = true;
