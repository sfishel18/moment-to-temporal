import moment from "moment";

export const toISOString = () => {
  return moment().toISOString();
};
