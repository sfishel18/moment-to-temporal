import {
  ASTPath,
  CallExpression,
  ImportDeclaration,
  JSCodeshift,
} from "jscodeshift";
import { fromStringImport, pollyfillImport } from "./imports";

export const processMomentFnCall = (
  path: ASTPath<CallExpression>,
  imports: ImportDeclaration[],
  j: JSCodeshift
): CallExpression | null => {
  const { arguments: initArgs } = path.node;
  if (initArgs.length === 0) {
    imports.push(pollyfillImport(j));
    return j.template.expression`Temporal.Now.zonedDateTimeISO()`;
  }
  if (initArgs.length === 2) {
    imports.push(fromStringImport(j));
    return j.template.expression`fromString(${initArgs})`;
  }

  return null;
};
