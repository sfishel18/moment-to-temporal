import {
  API,
  CallExpression,
  Collection,
  FileInfo,
  JSCodeshift,
  Options,
  ASTPath,
  File,
  ImportDeclaration,
} from "jscodeshift";
import { last, uniq } from "lodash";
import {
  findAllMomentDefaultSpecifiers,
  findAllMomentFactoryCalls,
  findAllReferencesShallow,
  removeUnusedReferences,
} from "./ast-utils";
import { ChainProcessor, ExpressionObject } from "./types";
import displayChainProcessors from "./transformations/display";
import manipulateChainProcessors from "./transformations/manipulate";
import { processMomentFnCall } from "./transformations/parse";

const addImports = (
  source: Collection<unknown>,
  imports: ImportDeclaration[],
  j: JSCodeshift
) => {
  const file = source.isOfType(j.File) ? (source as Collection<File>) : null;
  file?.nodes()[0]?.program.body.unshift(...uniq(imports));
};

const chainProcessors: Partial<Record<string, ChainProcessor>> = {
  ...displayChainProcessors,
  ...manipulateChainProcessors,
};

type CallChain = {
  init: ASTPath<CallExpression>;
  chains: ASTPath<CallExpression>[];
};

const invocationToChain = (path: ASTPath<CallExpression>, j: JSCodeshift) => {
  const chain: CallChain = {
    init: path,
    chains: [],
  };
  let currentPath = path;
  while (
    j.MemberExpression.check(currentPath.parentPath.node) &&
    j.CallExpression.check(currentPath.parentPath.parentPath.node)
  ) {
    chain.chains.push(currentPath.parentPath.parentPath);
    currentPath = currentPath.parentPath.parentPath;
  }
  return chain;
};

const getChainCallName = (
  node: CallExpression,
  j: JSCodeshift
): string | null => {
  if (
    j.MemberExpression.check(node.callee) &&
    j.Identifier.check(node.callee.property)
  ) {
    return node.callee.property.name;
  }
  return null;
};

const processInvocation = (
  path: ASTPath<CallExpression>,
  imports: ImportDeclaration[],
  j: JSCodeshift
): boolean => {
  const chain = invocationToChain(path, j);
  const initReplacement = processMomentFnCall(chain.init, imports, j);
  if (!initReplacement) {
    return false;
  }
  const chainBreaker = chain.chains.find((path) => {
    const name = getChainCallName(path.node, j);
    return name && chainProcessors[name]?.isBreaking;
  });
  if (!chainBreaker) {
    return false;
  }
  const subChain = chain.chains.slice(
    0,
    chain.chains.indexOf(chainBreaker) + 1
  );
  let outermostCall: ExpressionObject | null = initReplacement;
  subChain.forEach((path) => {
    const name = getChainCallName(path.node, j);
    if (name && outermostCall && chainProcessors[name]) {
      outermostCall =
        chainProcessors[name]?.process(path, outermostCall, imports, j) || null;
    } else {
      outermostCall = null;
    }
  });
  if (outermostCall !== null) {
    last(subChain)?.replace(outermostCall);
    return true;
  }
  return false;
};

export default function transform(
  file: FileInfo,
  { j }: API,
  options: Options
) {
  const source = j(file.source);
  const invocations = findAllMomentFactoryCalls(source, j);
  const imports: ImportDeclaration[] = [];
  invocations?.forEach((path) => {
    const pendingImports: ImportDeclaration[] = [];
    const wasProcessed = processInvocation(path, pendingImports, j);
    if (wasProcessed) {
      imports.push(...pendingImports);
    }
  });
  addImports(source, imports, j);
  findAllMomentDefaultSpecifiers(source, j)
    .find(j.Identifier)
    .forEach((path) => {
      const references = removeUnusedReferences(
        findAllReferencesShallow(path, j),
        j
      );
      if (references.size() === 0) {
        j(path).closest(j.ImportDeclaration).remove();
      }
    });
  return source.toSource(options.printOptions);
}
