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
  identifier: ASTPath<Identifier>,
  j: JSCodeshift
): Collection<Identifier> => {
  const idsToProcess = [identifier];
  const references: ASTPath<Identifier>[] = [];
  while (idsToProcess.length > 0) {
    const id = idsToProcess.shift();
    if (!id) {
      continue;
    }
    const localName = id.name;
    const matchingIds = j(id)
      .closestScope()
      .find(j.Identifier, { name: localName })
      .filter((path) => path !== id);

    matchingIds.forEach((path) => {
      const bindingId = path.scope.lookup(path.node.name).bindings[
        path.node.name
      ][0];
      if (bindingId.node !== id) {
        return;
      }
      references.push(path);
      const aliases = j([path])
        .closest(j.VariableDeclarator, (node) => node.init === id.node)
        .find(j.Identifier, (node) => node !== id.node);
      idsToProcess.push(...aliases.paths());
    });
  }
  return j(references);
};

export const removeUnusedReferences = (
  refs: Collection<Identifier>,
  j: JSCodeshift
): Collection<Identifier> => {
  const unusedReferences = refs.filter((path) => {
    const parentNode = path.parentPath.node;
    if (
      j.VariableDeclarator.check(parentNode) &&
      parentNode.init === path.node &&
      j.Identifier.check(parentNode.id)
    ) {
      return (
        removeUnusedReferences(
          // TODO: this function expects an import declaration,
          // but we're sending it a variable declaration
          findAllReferences(path.parentPath, j),
          j
        ).size() === 0
      );
    }
    return false;
  });
  unusedReferences.forEach((path) =>
    j([path]).closest(j.VariableDeclaration).remove()
  );
  return refs.filter(
    (path) => !unusedReferences.some((unusedPath) => unusedPath === path)
  );
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
  const references = specifiers.find(j.Identifier).map((path) => {
    return findAllReferences(path, j).paths();
  });
  return references.map((path) =>
    j.CallExpression.check(path.parentPath.node) ? path.parentPath : null
  );
};
