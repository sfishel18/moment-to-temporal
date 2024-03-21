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

export const objectLiteralArguments = () => {
  return moment().subtract({ minutes: 1 }).toDate().toISOString();
};

export const expectNoMoment = true;
