import moment from "moment";

export const one = () => {
  return moment().toDate().toISOString();
};

export const two = () => {
  return moment().add(1, "minutes").toDate().toISOString();
};

export const three = () => {
  return moment("2018", ["YYYY"]).toDate().toISOString();
};

export const expectNoMoment = true;
