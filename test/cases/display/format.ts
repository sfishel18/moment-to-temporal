import moment from "moment";

export const formatToYear = () => {
  return moment().format("YYYY");
};

export const escapedLiteralText = () => {
  return moment().format("[YYYY format returns:] YYYY");
};
