import {
  ASTPath,
  CallExpression,
  ImportDeclaration,
  JSCodeshift,
} from "jscodeshift";
import { pollyfillImport, toEpochNanosImport } from "./imports";

export const processMomentFnCall = (
  path: ASTPath<CallExpression>,
  imports: ImportDeclaration[],
  j: JSCodeshift,
): CallExpression | null => {
  const { arguments: initArgs } = path.node;
  if (initArgs.length === 0) {
    imports.push(pollyfillImport(j));
    return j.template.expression`Temporal.Now.zonedDateTimeISO()`;
  }
  if (initArgs.length <= 2) {
    imports.push(pollyfillImport(j));
    imports.push(toEpochNanosImport(j));
    return j.template.expression`new Temporal.ZonedDateTime(toEpochNanos(${initArgs}), Temporal.Now.timeZoneId())`
  }
  return null
};
