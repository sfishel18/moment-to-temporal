import {
  ASTPath,
  CallExpression,
  ImportDeclaration,
  JSCodeshift,
  MemberExpression,
} from "jscodeshift";

export type ExpressionObject = MemberExpression["object"];

export type ChainProcessor = {
  isBreaking?: boolean;
  process: (
    path: ASTPath<CallExpression>,
    next: ExpressionObject,
    imports: ImportDeclaration[],
    j: JSCodeshift,
  ) => ExpressionObject | null;
};
