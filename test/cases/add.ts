import moment from "moment";

export const primitveArguments = (): string => {
  return moment().add(1, "minutes").toDate().toISOString();
};

export const expectNoMoment = true;
