import moment from "moment";

// Every argument shape the duration/unit conversion must REJECT. None of
// these should be transformed (see `expectNoMoment: false` below).

const someUnit = "days";
const spreadArgs: [number, moment.unitOfTime.DurationConstructor] = [1, "days"];
const spreadProps = { days: 1 };
const computedKey = "days";

export const identifierUnit = (): string => {
  return moment().add(1, someUnit).toDate().toISOString();
};

export const numericUnit = (): string => {
  // @ts-expect-error deliberately invalid unit argument
  return moment().add(1, 42).toDate().toISOString();
};

export const spreadArguments = (): string => {
  return moment().add(...spreadArgs).toDate().toISOString();
};

export const spreadProperties = (): string => {
  return moment().add({ ...spreadProps }).toDate().toISOString();
};

export const computedObjectKey = (): string => {
  return moment().add({ [computedKey]: 1 }).toDate().toISOString();
};

export const unrecognizedObjectKey = (): string => {
  // @ts-expect-error deliberately invalid unit key
  return moment().add({ fortnights: 1 }).toDate().toISOString();
};

export const bareNumberArgument = (): string => {
  return moment().add(5).toDate().toISOString();
};

export const templateLiteralObjectKey = (): string => {
  // A computed template-literal key is not a string literal, plain literal,
  // or identifier — it must be rejected.
  return moment().add({ [`days`]: 1 }).toDate().toISOString();
};

export const numericObjectKey = (): string => {
  // @ts-expect-error deliberately invalid unit key
  return moment().add({ 42: 1 }).toDate().toISOString();
};

export const subtractSpreadArguments = (): string => {
  return moment().subtract(...spreadArgs).toDate().toISOString();
};

export const startOfSpread = (): string => {
  const args: ["day"] = ["day"];
  return moment().startOf(...args).toDate().toISOString();
};

export const startOfIdentifierUnit = (): string => {
  const unit = "day" as const;
  return moment().startOf(unit).toDate().toISOString();
};

export const startOfNumericUnit = (): string => {
  // @ts-expect-error deliberately invalid unit argument
  return moment().startOf(42).toDate().toISOString();
};

export const endOfSpread = (): string => {
  const args: ["day"] = ["day"];
  return moment().endOf(...args).toDate().toISOString();
};

export const endOfNumericUnit = (): string => {
  // @ts-expect-error deliberately invalid unit argument
  return moment().endOf(42).toDate().toISOString();
};

export const expectNoMoment = false;
