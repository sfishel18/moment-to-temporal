import { JSCodeshift, Literal, StringLiteral } from "jscodeshift";
import { ChainProcessor } from "../types";

const unitConversionMap: Partial<Record<string, string>> = {
  ms: "milliseconds",
  millisecond: "milliseconds",
  s: "seconds",
  second: "seconds",
  m: "minutes",
  minute: "minutes",
  h: "hours",
  hour: "hours",
  d: "days",
  day: "days",
  w: "weeks",
  week: "weeks",
  M: "months",
  month: "months",
  y: "years",
  year: "years",
};

const convertUnitArg = (
  unitArg: Literal | StringLiteral,
  j: JSCodeshift
): StringLiteral | null => {
  const value = unitArg.value;
  if (typeof value !== "string") {
    return null;
  }
  if (
    !Object.keys(unitConversionMap).includes(value) &&
    !Object.values(unitConversionMap).includes(value)
  ) {
    return null;
  }
  return j.stringLiteral(unitConversionMap[value] || value);
};

const chainProcessors: Record<string, ChainProcessor> = {
  add: {
    process: (path, next, _, j) => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        return null;
      }
      const [amountArg, unitArg] = path.node.arguments;
      if (j.SpreadElement.check(amountArg)) {
        return null;
      }
      if (!j.StringLiteral.check(unitArg) && !j.Literal.check(unitArg)) {
        return null;
      }
      const convertedUnitArg = convertUnitArg(unitArg, j);
      if (!convertedUnitArg) {
        return null;
      }
      return j.template
        .expression`${next}.add({ ${convertedUnitArg}: ${amountArg} })`;
    },
  },
};

export default chainProcessors;
