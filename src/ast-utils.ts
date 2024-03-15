import {
  ASTPath,
  CallExpression,
  Collection,
  Identifier,
  ImportDefaultSpecifier,
  ImportSpecifier,
  JSCodeshift,
} from "jscodeshift";

export const findAllReferences = (
  importSpecifier: ASTPath<ImportSpecifier | ImportDefaultSpecifier>,
  j: JSCodeshift
): Collection<Identifier> | null => {
  const localName = importSpecifier.node.local?.name;
  if (!localName) {
    return null;
  }
  return j(importSpecifier)
    .closestScope()
    .find(j.Identifier, { name: localName })
    .filter((path) => path.parentPath !== importSpecifier);
};

export const findAllMomentDefaultSpecifiers = (
  source: Collection<unknown>,
  j: JSCodeshift
): Collection<ImportDefaultSpecifier> =>
  source
    .find(j.ImportDeclaration)
    .filter((path) => path.node.source.value === "moment")
    .find(j.ImportDefaultSpecifier);

export const findAllMomentFactoryCalls = (
  source: Collection<unknown>,
  j: JSCodeshift
): Collection<CallExpression> => {
  const specifiers = findAllMomentDefaultSpecifiers(source, j);
  const references = specifiers.map((path) =>
    findAllReferences(path, j)?.paths()
  );
  return references.map((path) =>
    j.CallExpression.check(path.parentPath.node) ? path.parentPath : null
  );
};
