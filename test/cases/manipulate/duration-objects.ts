import moment from "moment";

// Object-form durations with key shapes beyond plain identifiers.

export const stringLiteralKeys = (): string => {
  return moment().add({ "days": 2, "h": 3 }).toDate().toISOString();
};

export const mixedKeyStyles = (): string => {
  return moment().subtract({ "minutes": 30, s: 10 }).toDate().toISOString();
};

export const expectNoMoment = true;
