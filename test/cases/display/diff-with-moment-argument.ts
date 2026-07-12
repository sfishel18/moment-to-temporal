import moment from "moment";

// The inner moment() call has no breaking method of its own, so it stays
// untransformed and keeps the moment import alive; the diff runtime helper
// accepts the leftover Moment via its valueOf().
export const diffAgainstMomentExpression = (): number => {
  return moment("2020-03-01T00:00:00").diff(
    moment("2020-02-01T00:00:00"),
    "months",
  );
};

export const expectNoMoment = false;

export const expectedAnnotations = [
  "only expressions that evaluate to a primitive or Date can be transformed",
];
