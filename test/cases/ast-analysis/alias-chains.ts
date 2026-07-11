import moment from "moment";

// Aliases of the moment *function* (not of moment instances). Unused aliases
// must be pruned so the moment import can still be removed.

const deadTopLevelAlias = moment;

export const usedThroughAlias = (): string => {
  const m = moment;
  return m("2018-10-18", "YYYY-MM-DD").toDate().toISOString();
};

export const unusedInnerAlias = (): string => {
  const alias = moment;
  return moment("2018-10-18", "YYYY-MM-DD").toDate().toISOString();
};

export const expectNoMoment = true;
