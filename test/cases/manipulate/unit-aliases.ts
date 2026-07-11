import moment from "moment";

// Exercises every alias in the unit conversion map through .add()/.subtract()
// so a wrong or missing map entry fails behaviorally.

export const addMs = (): string => {
  return moment().add(250, "ms").toDate().toISOString();
};

export const addMillisecond = (): string => {
  return moment().add(250, "millisecond").toDate().toISOString();
};

export const addS = (): string => {
  return moment().add(30, "s").toDate().toISOString();
};

export const addSecond = (): string => {
  return moment().add(30, "second").toDate().toISOString();
};

export const addM = (): string => {
  return moment().add(30, "m").toDate().toISOString();
};

export const addMinute = (): string => {
  return moment().add(30, "minute").toDate().toISOString();
};

export const addH = (): string => {
  return moment().add(3, "h").toDate().toISOString();
};

export const addHour = (): string => {
  return moment().add(3, "hour").toDate().toISOString();
};

export const addD = (): string => {
  return moment().add(3, "d").toDate().toISOString();
};

export const addDay = (): string => {
  return moment().add(3, "day").toDate().toISOString();
};

export const addW = (): string => {
  return moment().add(2, "w").toDate().toISOString();
};

export const addWeek = (): string => {
  return moment().add(2, "week").toDate().toISOString();
};

export const addWeeks = (): string => {
  return moment("2018-10-18", "YYYY-MM-DD").add(2, "weeks").toDate().toISOString();
};

export const addBigM = (): string => {
  return moment("2018-01-15", "YYYY-MM-DD").add(2, "M").toDate().toISOString();
};

export const addMonth = (): string => {
  return moment("2018-01-15", "YYYY-MM-DD").add(2, "month").toDate().toISOString();
};

export const addY = (): string => {
  return moment("2018-01-15", "YYYY-MM-DD").add(2, "y").toDate().toISOString();
};

export const addYear = (): string => {
  return moment("2018-01-15", "YYYY-MM-DD").add(2, "year").toDate().toISOString();
};

export const addYears = (): string => {
  return moment("2018-01-15", "YYYY-MM-DD").add(2, "years").toDate().toISOString();
};

export const subtractAliases = (): string => {
  return moment("2018-10-18", "YYYY-MM-DD")
    .subtract(1, "w")
    .subtract(2, "M")
    .subtract(3, "y")
    .subtract(4, "d")
    .toDate()
    .toISOString();
};

export const expectNoMoment = true;
