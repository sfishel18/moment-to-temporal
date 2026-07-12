import moment from "moment";

export const noArguments = (): number => {
  // moment().diff() diffs against "now", which is 0 under fake timers.
  return moment().diff();
};

export const dynamicUnit = (): number => {
  const unit = "days";
  return moment("2020-03-01T00:00:00").diff(new Date(2020, 1, 15), unit);
};

export const unrecognizedUnit = (): number => {
  // Moment supports quarters, but the unit conversion map does not (yet).
  return moment("2020-05-01T00:00:00").diff(new Date(2020, 0, 1), "quarters");
};

export const numericUnit = (): number => {
  // @ts-expect-error deliberately invalid unit argument
  return moment("2020-03-01T00:00:00").diff(new Date(2020, 1, 15), 42);
};

export const spreadOtherArgument = (): number => {
  const args: [Date] = [new Date(2020, 0, 1)];
  return moment("2020-05-01T00:00:00").diff(...args);
};

export const spreadFloatArgument = (): number => {
  const flags: [boolean] = [true];
  return moment("2020-01-02T00:00:00").diff(
    new Date(2020, 0, 1),
    "hours",
    ...flags,
  );
};

export const expectNoMoment = false;

export const expectedAnnotations = [
  "failed to transform `diff`: an argument is required",
  "failed to transform `diff`: unit is not a string literal",
  "failed to transform `diff`: unit is not a string",
  'failed to transform `diff`: unit "quarters" is not recognized',
  "failed to transform `diff`: spread arguments are not supported",
  "failed to transform `diff`: the float flag cannot be a spread argument",
];
