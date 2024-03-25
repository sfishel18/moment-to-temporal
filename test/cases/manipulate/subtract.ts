import moment from "moment";

export const primitveArguments = (): string => {
  return moment().subtract(1, "minutes").toDate().toISOString();
};

export const primitveArgumentsWithAbbreviation = (): string => {
  return moment().subtract(1, "h").toDate().toISOString();
};

export const primitveArgumentsWithSingularUnit = (): string => {
  return moment().subtract(1, "day").toDate().toISOString();
};

export const clippingToLastDayOfMonth = () => {
  return moment("2018-03-31", ["YYYY-MM-DD"])
    .subtract(1, "months")
    .toDate()
    .toISOString();
};

export const objectLiteralArguments = () => {
  return moment().subtract({ minutes: 1 }).toDate().toISOString();
};

export const objectLiteralMultipleArguments = () => {
  return moment().subtract({ minutes: 1, h: 1, day: 1 }).toDate().toISOString();
};

export const expectNoMoment = true;
