import moment from "moment";

export const diffDefaultsToMilliseconds = (): number => {
  return moment("2020-03-01T06:30:00").diff(new Date(2020, 1, 15));
};

export const diffInDays = (): number => {
  return moment("2020-03-01T06:30:00").diff(new Date(2020, 1, 15), "days");
};

export const diffWithUnitAlias = (): number => {
  return moment("2020-03-01T06:30:00").diff(new Date(2020, 1, 15), "d");
};

export const diffInMonths = (): number => {
  return moment("2020-05-15T00:00:00").diff(new Date(2020, 0, 15), "months");
};

export const diffAsFloat = (): number => {
  return moment("2020-01-02T03:30:00").diff(new Date(2020, 0, 1), "hours", true);
};

export const diffWithExplicitFalseFloat = (): number => {
  return moment("2020-01-02T03:30:00").diff(new Date(2020, 0, 1), "hours", false);
};

export const negativeDiffTruncatesTowardZero = (): number => {
  // -1.5 days: moment yields -1 (truncation toward zero, not floor).
  return moment("2020-01-01T00:00:00").diff(new Date(2020, 0, 2, 12), "days");
};

export const smallNegativeDiffIsPositiveZero = (): number => {
  // -0.5 days truncates to -0; moment normalizes that to 0.
  return moment("2020-01-01T00:00:00").diff(new Date(2020, 0, 1, 12), "days");
};

export const diffAgainstEpochMilliseconds = (): number => {
  return moment("2020-01-02T00:00:00").diff(1577950000000, "seconds");
};

export const expectNoMoment = true;
