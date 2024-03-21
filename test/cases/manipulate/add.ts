import moment from "moment";

export const primitveArguments = (): string => {
  return moment().add(1, "minutes").toDate().toISOString();
};

export const primitveArgumentsWithAbbreviation = (): string => {
  return moment().add(1, "h").toDate().toISOString();
};

export const primitveArgumentsWithSingularUnit = (): string => {
  return moment().add(1, "day").toDate().toISOString();
};

export const clippingToLastDayOfMonth = () => {
  return moment("2018-01-31", ["YYYY-MM-DD"])
    .add(1, "months")
    .toDate()
    .toISOString();
};

export const objectLiteralArguments = () => {
  return moment().add({ minutes: 1 }).toDate().toISOString();
};

export const expectNoMoment = true;
