import {
  ASTPath,
  CallExpression,
  Collection,
  Identifier,
  ImportDefaultSpecifier,
  JSCodeshift,
} from "jscodeshift";

export const findAllReferencesShallow = (
  identifier: ASTPath<Identifier>,
  j: JSCodeshift,
): Collection<Identifier> =>
  j(identifier)
    .closestScope()
    .find(j.Identifier, { name: identifier.node.name })
    // exclude the original identifier
    .filter((path) => path.node !== identifier.node)
    // exclude references to a variable of the same name that shadows the original
    .filter((path) => {
      const bindingId = path.scope.lookup(path.node.name).bindings[
        path.node.name
      ][0];
      return bindingId.node === identifier.node;
    });

const findReferenceAliases = (
  identifier: ASTPath<Identifier>,
  j: JSCodeshift,
): Collection<Identifier> =>
  j([identifier])
    .closest(
      j.VariableDeclarator,
      (declarator) => declarator.init === identifier.node,
    )
    .find(j.Identifier, (aliasId) => aliasId !== identifier.node);

const findAllReferences = (
  identifier: ASTPath<Identifier>,
  j: JSCodeshift,
): Collection<Identifier> => {
  const idsToProcess = [identifier];
  const references: ASTPath<Identifier>[] = [];
  while (idsToProcess.length > 0) {
    const id = idsToProcess.shift();
    if (!id) {
      continue;
    }
    const matchingIds = findAllReferencesShallow(id, j);
    matchingIds.forEach((path) => {
      references.push(path);
      const aliases = findReferenceAliases(path, j);
      idsToProcess.push(...aliases.paths());
    });
  }
  return j(references);
};

export const removeUnusedReferences = (
  refs: Collection<Identifier>,
  j: JSCodeshift,
): Collection<Identifier> => {
  const unusedReferences = refs.filter((path) => {
    const aliases = findReferenceAliases(path, j);
    const aliasReferences = aliases.map((aliasPath) =>
      removeUnusedReferences(findAllReferencesShallow(aliasPath, j), j).paths(),
    );
    return aliases.size() > 0 && aliasReferences.size() === 0;
  });
  const usedReferenes = refs.filter(
    (path) =>
      !unusedReferences.some((unusedPath) => unusedPath.node === path.node),
  );
  unusedReferences.closest(j.VariableDeclaration).remove();
  return usedReferenes;
};

export const findAllMomentDefaultSpecifiers = (
  source: Collection<unknown>,
  j: JSCodeshift,
): Collection<ImportDefaultSpecifier> =>
  source
    .find(j.ImportDeclaration)
    .filter((path) => path.node.source.value === "moment")
    .find(j.ImportDefaultSpecifier);

export const findAllMomentFactoryCalls = (
  source: Collection<unknown>,
  j: JSCodeshift,
): Collection<CallExpression> => {
  const specifiers = findAllMomentDefaultSpecifiers(source, j);
  const references = specifiers.find(j.Identifier).map((path) => {
    return findAllReferences(path, j).paths();
  });
  return references.map((path) =>
    j.CallExpression.check(path.parentPath.node) ? path.parentPath : null,
  );
};
