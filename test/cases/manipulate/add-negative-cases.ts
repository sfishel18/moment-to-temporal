import moment from "moment";

export const quartersAsUnits = (): string => {
  return moment().add(1, "quarter").toDate().toISOString();
};

export const expectNoMoment = false;
