import moment from "moment";

export const directUsage = () => {
  const moment = () => ({ toDate: () => ({ toISOString: () => "oops" }) });
  return moment().toDate().toISOString();
};

export const expectNoMoment = true;
