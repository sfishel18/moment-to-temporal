import moment from "moment";

// Format-driven parsing where the format matters: non-ISO inputs (an ISO
// fallback parse would produce a different date or an invalid one) and
// format arrays where a later entry must win.

export const nonIsoFormat = (): string => {
  return moment("10/18/2018", "MM/DD/YYYY").toDate().toISOString();
};

export const nonIsoFormatDayFirst = (): string => {
  return moment("18.10.2018", "DD.MM.YYYY").toDate().toISOString();
};

export const formatArrayFirstFails = (): string => {
  return moment("10/18/2018", ["YYYY-MM-DD", "MM/DD/YYYY"])
    .toDate()
    .toISOString();
};

export const formatArrayFirstWins = (): string => {
  return moment("2018-10-18", ["YYYY-MM-DD", "MM/DD/YYYY"])
    .toDate()
    .toISOString();
};

export const expectNoMoment = true;
