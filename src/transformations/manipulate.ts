import {
  CallExpression,
  JSCodeshift,
  Literal,
  ObjectExpression,
  Property,
  StringLiteral,
  Identifier,
} from "jscodeshift";
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
  date: "days",
  w: "weeks",
  week: "weeks",
  M: "months",
  month: "months",
  y: "years",
  year: "years",
};

const notRoundableUnits = ["weeks", "months", "years"];

const convertUnitArg = (
  unitArg: Literal | StringLiteral | Identifier,
  j: JSCodeshift
): StringLiteral | null => {
  const value = j.Identifier.check(unitArg) ? unitArg.name : unitArg.value;
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

const convertDurationArgs = (
  args: CallExpression["arguments"],
  j: JSCodeshift
): ObjectExpression | null => {
  if (args.length === 2) {
    const [amountArg, unitArg] = args;
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
    return j.template.expression`{ ${convertedUnitArg}: ${amountArg} }`;
  }
  if (args.length === 1) {
    const [durationArg] = args;
    if (j.ObjectExpression.check(durationArg)) {
      const convertedProperties: Property[] = [];
      for (let i = 0; i < durationArg.properties.length; i++) {
        const property = durationArg.properties[i];
        if (!j.Property.check(property) && !j.ObjectProperty.check(property)) {
          return null;
        }
        const { key, value } = property;
        if (
          !j.StringLiteral.check(key) &&
          !j.Literal.check(key) &&
          !j.Identifier.check(key)
        ) {
          return null;
        }
        const convertedUnitArg = convertUnitArg(key, j);
        if (!convertedUnitArg) {
          return null;
        }
        convertedProperties.push(
          j.property.from({ key: convertedUnitArg, value, kind: "init" })
        );
      }
      return j.objectExpression.from({ properties: convertedProperties });
    }
  }
  return null;
};

const chainProcessors: Record<string, ChainProcessor> = {
  add: {
    process: (path, next, _, j) => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        return null;
      }
      const convertedDuration = convertDurationArgs(path.node.arguments, j);
      if (!convertedDuration) {
        return null;
      }
      return j.template.expression`${next}.add(${convertedDuration})`;
    },
  },
  subtract: {
    process: (path, next, _, j) => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        return null;
      }
      const convertedDuration = convertDurationArgs(path.node.arguments, j);
      if (!convertedDuration) {
        return null;
      }
      return j.template.expression`${next}.subtract(${convertedDuration})`;
    },
  },
  startOf: {
    process: (path, next, _, j) => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        return null;
      }
      const [unitArg] = path.node.arguments;
      if (j.SpreadElement.check(unitArg)) {
        return null;
      }
      if (!j.StringLiteral.check(unitArg) && !j.Literal.check(unitArg)) {
        return null;
      }
      const convertedUnit = convertUnitArg(unitArg, j);
      if (
        !convertedUnit?.value ||
        notRoundableUnits.includes(convertedUnit?.value)
      ) {
        return null;
      }
      return j.template
        .expression`${next}.round({ smallestUnit: ${convertedUnit}, roundingMode: 'floor' })`;
    },
  },
  endOf: {
    process: (path, next, _, j) => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        return null;
      }
      const [unitArg] = path.node.arguments;
      if (j.SpreadElement.check(unitArg)) {
        return null;
      }
      if (!j.StringLiteral.check(unitArg) && !j.Literal.check(unitArg)) {
        return null;
      }
      const convertedUnit = convertUnitArg(unitArg, j);
      if (
        !convertedUnit?.value ||
        notRoundableUnits.includes(convertedUnit?.value)
      ) {
        return null;
      }
      return j.template
        .expression`${next}.round({ smallestUnit: ${convertedUnit}, roundingMode: 'ceil' }).subtract({ milliseconds: 1 })`;
    },
  },
};

export default chainProcessors;
