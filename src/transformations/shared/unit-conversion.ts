import {
  CallExpression,
  Identifier,
  JSCodeshift,
  Literal,
  ObjectExpression,
  Property,
  StringLiteral,
} from "jscodeshift";
// Narrow result types for internal use — same shape as ProcessorResult but
// with a typed `expression` field.
type OkResult<T> = { ok: true; expression: T };
type FailResult = { ok: false; reason: string };
type TypedResult<T> = OkResult<T> | FailResult;

export const unitConversionMap: Partial<Record<string, string>> = {
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

export const notRoundableUnits = ["weeks", "months", "years"];

export const convertUnitArg = (
  unitArg: Literal | StringLiteral | Identifier,
  j: JSCodeshift,
): TypedResult<StringLiteral> => {
  const value = j.Identifier.check(unitArg) ? unitArg.name : unitArg.value;
  if (typeof value !== "string") {
    return { ok: false, reason: "unit is not a string" };
  }
  if (
    !Object.keys(unitConversionMap).includes(value) &&
    !Object.values(unitConversionMap).includes(value)
  ) {
    return { ok: false, reason: `unit "${value}" is not recognized` };
  }
  return {
    ok: true,
    expression: j.stringLiteral(unitConversionMap[value] ?? value),
  };
};

export const convertDurationArgs = (
  args: CallExpression["arguments"],
  j: JSCodeshift,
): TypedResult<ObjectExpression> => {
  if (args.length === 2) {
    const [amountArg, unitArg] = args;
    if (j.SpreadElement.check(amountArg)) {
      return { ok: false, reason: "spread operator is not supported" };
    }
    if (!j.StringLiteral.check(unitArg) && !j.Literal.check(unitArg)) {
      return { ok: false, reason: "unit is not a string literal" };
    }
    const convertedUnitArg = convertUnitArg(unitArg, j);
    if (!convertedUnitArg.ok) {
      return convertedUnitArg;
    }
    return {
      ok: true,
      expression: j.template
        .expression`{ ${convertedUnitArg.expression}: ${amountArg} }`,
    };
  }
  if (args.length === 1) {
    const [durationArg] = args;
    if (j.ObjectExpression.check(durationArg)) {
      const convertedProperties: Property[] = [];
      for (let i = 0; i < durationArg.properties.length; i++) {
        const property = durationArg.properties[i];
        if (!j.Property.check(property) && !j.ObjectProperty.check(property)) {
          return { ok: false, reason: "spread properties are not supported" };
        }
        const { key, value } = property;
        if (
          !j.StringLiteral.check(key) &&
          !j.Literal.check(key) &&
          !j.Identifier.check(key)
        ) {
          return {
            ok: false,
            reason: "all object keys are not string literals",
          };
        }
        const convertedUnitArg = convertUnitArg(key, j);
        if (!convertedUnitArg.ok) {
          return convertedUnitArg;
        }
        convertedProperties.push(
          j.property.from({
            key: convertedUnitArg.expression,
            value,
            kind: "init",
            computed: false,
          }),
        );
      }
      return {
        ok: true,
        expression: j.objectExpression.from({
          properties: convertedProperties,
        }),
      };
    }
  }
  return { ok: false, reason: "expected an object literal" };
};

// Re-export as ProcessorResult-compatible for use in processors
export type UnitResult = TypedResult<StringLiteral>;
export type DurationResult = TypedResult<ObjectExpression>;
