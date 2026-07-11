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

export const endOfIdentifierUnit = (): string => {
  const unit = "day" as const;
  return moment().endOf(unit).toDate().toISOString();
};

export const spreadAmountWithLiteralUnit = (): string => {
  const amount: [number] = [1];
  return moment().add(...amount, "days").toDate().toISOString();
};

export const endOfNumericUnit = (): string => {
  // @ts-expect-error deliberately invalid unit argument
  return moment().endOf(42).toDate().toISOString();
};

export const expectNoMoment = false;

export const expectedAnnotations = [
  "failed to transform `add`: unit is not a string literal",
  "failed to transform `add`: unit is not a string",
  "failed to transform `add`: expected an object literal",
  "failed to transform `add`: spread properties are not supported",
  'failed to transform `add`: unit "computedKey" is not recognized',
  'failed to transform `add`: unit "fortnights" is not recognized',
  "failed to transform `add`: all object keys are not string literals",
  "failed to transform `subtract`: expected an object literal",
  "failed to transform `startOf`: spread operator not supported",
  "failed to transform `startOf`: unit is not a string literal",
  "failed to transform `startOf`: unit is not a string",
  "failed to transform `endOf`: spread operator not supported",
  "failed to transform `endOf`: unit is not a string",
  "failed to transform `endOf`: unit is not a string literal",
  "failed to transform `add`: spread operator is not supported",
];
