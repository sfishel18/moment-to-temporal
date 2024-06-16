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
import { annotatePath } from "../ast-utils";

type Result<T> =
  | { result: T; failedReason?: never }
  | { result?: never; failedReason: string };

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
): Result<StringLiteral> => {
  const value = j.Identifier.check(unitArg) ? unitArg.name : unitArg.value;
  if (typeof value !== "string") {
    return { failedReason: "unit is not a string" };
  }
  if (
    !Object.keys(unitConversionMap).includes(value) &&
    !Object.values(unitConversionMap).includes(value)
  ) {
    return { failedReason: `unit "${value}" is not recognized` };
  }
  return { result: j.stringLiteral(unitConversionMap[value] || value) };
};

const convertDurationArgs = (
  args: CallExpression["arguments"],
  j: JSCodeshift
): Result<ObjectExpression> => {
  if (args.length === 2) {
    const [amountArg, unitArg] = args;
    if (j.SpreadElement.check(amountArg)) {
      return { failedReason: "spread operator is not supported" };
    }
    if (!j.StringLiteral.check(unitArg) && !j.Literal.check(unitArg)) {
      return { failedReason: "unit is not a string literal" };
    }
    const convertedUnitArg = convertUnitArg(unitArg, j);
    if (!convertedUnitArg.result) {
      return convertedUnitArg;
    }
    return {
      result: j.template
        .expression`{ ${convertedUnitArg.result}: ${amountArg} }`,
    };
  }
  if (args.length === 1) {
    const [durationArg] = args;
    if (j.ObjectExpression.check(durationArg)) {
      const convertedProperties: Property[] = [];
      for (let i = 0; i < durationArg.properties.length; i++) {
        const property = durationArg.properties[i];
        if (!j.Property.check(property) && !j.ObjectProperty.check(property)) {
          return { failedReason: "spread properties are not supported" };
        }
        const { key, value } = property;
        if (
          !j.StringLiteral.check(key) &&
          !j.Literal.check(key) &&
          !j.Identifier.check(key)
        ) {
          return { failedReason: "all object keys are not string literals" };
        }
        const convertedUnitArg = convertUnitArg(key, j);
        if (!convertedUnitArg.result) {
          return convertedUnitArg;
        }
        convertedProperties.push(
          j.property.from({
            key: convertedUnitArg.result,
            value,
            kind: "init",
          })
        );
      }
      return {
        result: j.objectExpression.from({ properties: convertedProperties }),
      };
    }
  }
  return { failedReason: "expected an object literal" };
};

const chainProcessors: Record<string, ChainProcessor> = {
  add: {
    process: (path, next, _, j) => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        annotatePath(
          path,
          `failed to transform \`add\`: not called as a member function`,
          j
        );
        return null;
      }
      const convertedDuration = convertDurationArgs(path.node.arguments, j);
      if (!convertedDuration.result) {
        annotatePath(
          path,
          `failed to transform \`add\`: ${convertedDuration.failedReason}`,
          j
        );
        return null;
      }
      return j.template.expression`${next}.add(${convertedDuration.result})`;
    },
  },
  subtract: {
    process: (path, next, _, j) => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        annotatePath(
          path,
          `failed to transform \`subtract\`: not called as a member function`,
          j
        );
        return null;
      }
      const convertedDuration = convertDurationArgs(path.node.arguments, j);
      if (!convertedDuration || !convertedDuration.result) {
        annotatePath(
          path,
          `failed to transform \`subtract\`: ${convertedDuration.failedReason}`,
          j
        );
        return null;
      }
      return j.template
        .expression`${next}.subtract(${convertedDuration.result})`;
    },
  },
  startOf: {
    process: (path, next, _, j) => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        annotatePath(
          path,
          `failed to transform \`startOf\`: not called as a member function`,
          j
        );
        return null;
      }
      const [unitArg] = path.node.arguments;
      if (j.SpreadElement.check(unitArg)) {
        annotatePath(
          path,
          `failed to transform \`startOf\`: spread operator not supported`,
          j
        );
        return null;
      }
      if (!j.StringLiteral.check(unitArg) && !j.Literal.check(unitArg)) {
        annotatePath(
          path,
          `failed to transform \`startOf\`: unit is not a string literal`,
          j
        );
        return null;
      }
      const convertedUnit = convertUnitArg(unitArg, j);
      if (!convertedUnit || !convertedUnit.result) {
        annotatePath(
          path,
          `failed to transform \`startOf\`: ${convertedUnit.failedReason}`,
          j
        );
        return null;
      }
      if (
        !convertedUnit.result.value ||
        notRoundableUnits.includes(convertedUnit.result.value)
      ) {
        annotatePath(
          path,
          `failed to transform \`startOf\`: unit "${convertedUnit.result.value}" does not support rounding`,
          j
        );
        return null;
      }
      return j.template
        .expression`${next}.round({ smallestUnit: ${convertedUnit.result}, roundingMode: 'floor' })`;
    },
  },
  endOf: {
    process: (path, next, _, j) => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        annotatePath(
          path,
          `failed to transform \`endOf\`: not called as a member function`,
          j
        );
        return null;
      }
      const [unitArg] = path.node.arguments;
      if (j.SpreadElement.check(unitArg)) {
        annotatePath(
          path,
          `failed to transform \`endOf\`: spread operator not supported`,
          j
        );
        return null;
      }
      if (!j.StringLiteral.check(unitArg) && !j.Literal.check(unitArg)) {
        annotatePath(
          path,
          `failed to transform \`endOf\`: unit is not a string literal`,
          j
        );
        return null;
      }
      const convertedUnit = convertUnitArg(unitArg, j);
      if (!convertedUnit || !convertedUnit.result) {
        annotatePath(
          path,
          `failed to transform \`endOf\`: ${convertedUnit.failedReason}`,
          j
        );
        return null;
      }
      if (
        !convertedUnit.result.value ||
        notRoundableUnits.includes(convertedUnit.result.value)
      ) {
        annotatePath(
          path,
          `failed to transform \`endOf\`: unit "${convertedUnit.result.value}" does not support rounding`,
          j
        );
        return null;
      }
      return j.template
        .expression`${next}.round({ smallestUnit: ${convertedUnit.result}, roundingMode: 'ceil' }).subtract({ milliseconds: 1 })`;
    },
  },
};

export default chainProcessors;
