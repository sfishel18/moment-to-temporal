import moment from "moment";

export const basicUnix = (): number => {
  return moment().unix();
};

export const unixAfterChain = (): number => {
  return moment().add(90, "minutes").subtract(3, "days").unix();
};

export const unixFromParsedString = (): number => {
  return moment("2018-10-18T04:19:07.250").unix();
};

export const unixBeforeEpochFloorsTowardNegativeInfinity = (): number => {
  // -600ms epoch: Math.floor gives -1, Math.trunc would give 0.
  return moment(-600).unix();
};

export const expectNoMoment = true;
