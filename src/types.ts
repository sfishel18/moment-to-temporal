import {
  ASTPath,
  CallExpression,
  ImportDeclaration,
  JSCodeshift,
  MemberExpression,
} from "jscodeshift";

export type ExpressionObject = MemberExpression["object"];

export type ImportFactory = (j: JSCodeshift) => ImportDeclaration;

export type ProcessorResult =
  | { ok: true; expression: ExpressionObject }
  | { ok: false; reason: string };

export type ChainProcessor = {
  isBreaking?: boolean;
  process: (
    path: ASTPath<CallExpression>,
    next: ExpressionObject,
    j: JSCodeshift,
  ) => ProcessorResult;
};
