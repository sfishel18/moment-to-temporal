import moment from "moment";

// Chains containing a method with no registered processor must be left
// untouched — including when the unsupported call sits before a supported
// breaking call, and inside a unary plus coercion.

// `.local()` is the unsupported exemplar: it has no registered processor,
// and on a local-mode moment it is a runtime no-op, so the untransformed
// original and "transformed" output stay behaviorally identical.

export const unsupportedBeforeBreaker = (): string => {
  return moment().local().toDate().toISOString();
};

export const unsupportedInsideUnaryPlus = (): number => {
  return +moment().local();
};

export const unsupportedAfterAdd = (): number => {
  return moment().add(1, "day").local().valueOf();
};

export const unaryMinusIsNotACoercion = (): number => {
  // Only unary PLUS is treated as an implicit .valueOf() coercion.
  return -moment("2018-10-18T00:00:00");
};

export const computedMethodCall = (): string => {
  // A computed callee has no statically-known method name.
  return moment()["toDate"]().toISOString();
};

export const computedIdentifierCallee = (): string => {
  // The identifier inside a computed callee must not be mistaken for a
  // literal method name — `toDate` here holds "toISOString".
  const toDate = "toISOString" as const;
  return moment("2018-10-18T00:00:00")[toDate]();
};

export const methodReferenceIsNotAChain = (): string => {
  // Accessing a method without calling it must not be treated as a chain.
  const ref = moment("2018-10-18T00:00:00").toDate;
  return typeof ref;
};

export const expectNoMoment = false;

export const expectedAnnotations = [
  'the "local" method is not yet supported',
  "only expressions that evaluate to a primitive or Date can be transformed",
];
