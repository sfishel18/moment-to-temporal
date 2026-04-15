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
import fs from "node:fs";
import {
  annotatePath,
  findAllMomentDefaultSpecifiers,
  findAllMomentFactoryCalls,
  findAllReferencesShallow,
  isUnaryPlusCoercion,
  removeUnusedReferences,
} from "./ast-utils";
import { ChainProcessor, ExpressionObject } from "./types";
import displayChainProcessors from "./transformations/display";
import manipulateChainProcessors from "./transformations/manipulate";
import { processMomentFnCall } from "./transformations/parse";
import { importDependencyMap, allImports } from "./transformations/imports";

const addImports = (
  source: Collection<unknown>,
  imports: ImportDeclaration[],
  j: JSCodeshift,
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
  j: JSCodeshift,
): string | null => {
  if (
    j.MemberExpression.check(node.callee) &&
    j.Identifier.check(node.callee.property)
  ) {
    return node.callee.property.name;
  }
  return null;
};

const processChainSteps = (
  steps: ASTPath<CallExpression>[],
  initialExpr: ExpressionObject,
  imports: ImportDeclaration[],
  j: JSCodeshift,
  opts?: { annotateUnsupported?: boolean },
): ExpressionObject | null => {
  let expr: ExpressionObject | null = initialExpr;
  for (const step of steps) {
    const name = getChainCallName(step.node, j);
    if (name && expr && chainProcessors[name]) {
      expr = chainProcessors[name]?.process(step, expr, imports, j) || null;
    } else {
      if (opts?.annotateUnsupported && name && !chainProcessors[name]) {
        annotatePath(step, `the "${name}" method is not yet supported`, j);
      }
      expr = null;
      break;
    }
  }
  return expr;
};

const processInvocation = (
  path: ASTPath<CallExpression>,
  imports: ImportDeclaration[],
  j: JSCodeshift,
): boolean => {
  const chain = invocationToChain(path, j);
  const initReplacement = processMomentFnCall(chain.init, imports, j);
  if (!initReplacement) {
    return false;
  }
  // +moment(...) or +moment().add(...) etc. — unary plus is implicit .valueOf().
  // The + operator wraps the outermost call in the chain, so check there rather
  // than on the moment() init call itself.
  const chainBreaker = chain.chains.find((path) => {
    const name = getChainCallName(path.node, j);
    return name && chainProcessors[name]?.isBreaking;
  });
  const outermostPath = last(chain.chains) ?? path;
  if (isUnaryPlusCoercion(outermostPath, j)) {
    // If a chain breaker exists (e.g., valueOf), only process steps up to and
    // including it. Steps after the breaker stay as-is since they operate on
    // the primitive value returned by the breaker.
    const stepsToProcess = chainBreaker
      ? chain.chains.slice(0, chain.chains.indexOf(chainBreaker) + 1)
      : chain.chains;
    const builtExpr = processChainSteps(
      stepsToProcess,
      initReplacement,
      imports,
      j,
    );
    if (builtExpr !== null) {
      if (chainBreaker) {
        // Reconstruct the suffix chain: .toString().slice(0, 3) from
        // +moment().valueOf().toString().slice(0, 3)
        const breakerIdx = chain.chains.indexOf(chainBreaker);
        const afterBreaker = chain.chains.slice(breakerIdx + 1);
        let expr = builtExpr;
        for (const step of afterBreaker) {
          const callee = step.node.callee;
          if (j.MemberExpression.check(callee)) {
            expr = j.callExpression(
              j.memberExpression(expr, callee.property),
              step.node.arguments,
            );
          }
        }
        // Preserve the unary + operator since we're now working with a primitive
        const unary = outermostPath.parentPath.node;
        const replacement = j.unaryExpression(unary.operator, expr);
        outermostPath.parentPath.replace(replacement);
      } else {
        // No chain breaker found, so +moment() becomes .epochMilliseconds
        const epochMs = j.template.expression`${builtExpr}.epochMilliseconds`;
        outermostPath.parentPath.replace(epochMs);
      }
      return true;
    }
    return false;
  }

  if (!chainBreaker) {
    annotatePath(
      path,
      "only expressions that evaluate to a primitive or Date can be transformed",
      j,
    );
    return false;
  }
  const subChain = chain.chains.slice(
    0,
    chain.chains.indexOf(chainBreaker) + 1,
  );
  const outermostCall = processChainSteps(
    subChain,
    initReplacement,
    imports,
    j,
    { annotateUnsupported: true },
  );
  if (outermostCall !== null) {
    last(subChain)?.replace(outermostCall);
    return true;
  }
  return false;
};

export default function transform(
  file: FileInfo,
  { j }: API,
  options: Options,
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
        j,
      );
      if (references.size() === 0) {
        j(path).closest(j.ImportDeclaration).remove();
      }
    });

  if (options["resultFilePath"]) {
    fs.writeFileSync(
      options["resultFilePath"],
      JSON.stringify({
        importsAdded: uniq(
          imports.flatMap((i) => {
            const matchingFactory = allImports.find((f) => f(j) === i);
            return importDependencyMap.get(matchingFactory) || [];
          }),
        ),
      }),
      {
        encoding: "utf-8",
      },
    );
    options["importsAdded"]?.("aha");
  }
  return source.toSource(options["printOptions"]);
}
