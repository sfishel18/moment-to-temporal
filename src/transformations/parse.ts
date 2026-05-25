import { ASTPath, CallExpression, JSCodeshift } from "jscodeshift";
import { ImportFactory } from "../types";
import { pollyfillImport, toEpochNanosImport } from "./import-factories";

export type ParseResult = {
  expression: CallExpression;
  imports: ImportFactory[];
} | null;

export const processMomentFnCall = (
  path: ASTPath<CallExpression>,
  j: JSCodeshift,
): ParseResult => {
  const { arguments: initArgs } = path.node;
  if (initArgs.length === 0) {
    return {
      expression: j.template.expression`Temporal.Now.zonedDateTimeISO()`,
      imports: [pollyfillImport],
    };
  }
  if (initArgs.length <= 2) {
    return {
      expression: j.template
        .expression`new Temporal.ZonedDateTime(toEpochNanos(${initArgs}), Temporal.Now.timeZoneId())`,
      imports: [pollyfillImport, toEpochNanosImport],
    };
  }
  return null;
};
