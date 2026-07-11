import moment from "moment";

// moment() with three or more arguments (e.g. strict-mode parsing) is not
// supported — the chain must be left untouched.

export const strictModeParsing = (): string => {
  return moment("2018-10-18", "YYYY-MM-DD", true).toDate().toISOString();
};

export const localeAndStrictParsing = (): string => {
  return moment("2018-10-18", "YYYY-MM-DD", "en", true).toDate().toISOString();
};

export const expectNoMoment = false;
