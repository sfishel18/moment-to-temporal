import moment from "moment";

export const directUsage = () => {
  return moment().toDate().toISOString();
};

export const indirectUsageSameScope = () => {
  const mmt = moment;
  return mmt().toDate().toISOString();
};

export const expectNoMoment = true;
