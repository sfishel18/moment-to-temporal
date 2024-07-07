import moment from "moment";

export const formatToYear = () => {
  return moment().format("YYYY");
};

export const escapedLiteralText = () => {
  return moment().format("[YYYY format returns:] YYYY");
};

export const formatWithAmPm = () => {
  return moment().format("MM/DD/YYYY hh:mm:ss A");
}

export const expectNoMoment = true;