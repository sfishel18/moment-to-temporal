import moment from "moment";

export const directUsage = () => {
  return moment().toDate().toISOString();
};

export const indirectUsageSameScope = () => {
  const mmt = moment;
  return mmt().toDate().toISOString();
};

const mmt1 = moment;
export const indirectUsageMultipleScopes = () => {
  const mmt2 = mmt1;
  return mmt2().toDate().toISOString();
};

export const expectNoMoment = true;
