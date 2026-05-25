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
import { ExpressionObject, ImportFactory } from "./types";
import { processMomentFnCall } from "./transformations/parse";
import { loadAllProcessors } from "./transformations/load-processors";
import {
  getProcessor,
  resolveImports,
  getAllImportFactories,
  getDependencyMap,
} from "./transformations/registry";
import {
  pollyfillImport,
  toEpochNanosImport,
} from "./transformations/import-factories";

loadAllProcessors();

const addImports = (
  source: Collection<unknown>,
  imports: ImportDeclaration[],
  j: JSCodeshift,
) => {
  const file = source.isOfType(j.File) ? (source as Collection<File>) : null;
  file?.nodes()[0]?.program.body.unshift(...uniq(imports));
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

/**
 * Walk a list of chained call steps, dispatching each to its registered
 * processor. Accumulates import factories for all successfully invoked
 * processors. Returns the final expression and collected factories, or null
 * if the chain could not be fully processed.
 */
const processChainSteps = (
  steps: ASTPath<CallExpression>[],
  initialExpr: ExpressionObject,
  j: JSCodeshift,
  opts?: { annotateUnsupported?: boolean },
): { expression: ExpressionObject; importFactories: ImportFactory[] } | null => {
  let expr: ExpressionObject = initialExpr;
  const importFactories: ImportFactory[] = [];

  for (const step of steps) {
    const name = getChainCallName(step.node, j);
    const processor = name ? getProcessor(name) : undefined;

    if (!processor) {
      if (opts?.annotateUnsupported && name) {
        annotatePath(step, `the "${name}" method is not yet supported`, j);
      }
      return null;
    }

    // Centralized MemberExpression guard — all chained calls must be member
    // expressions. Individual processors no longer need to check this.
    if (!j.MemberExpression.check(step.node.callee)) {
      annotatePath(
        step,
        `failed to transform \`${name}\`: not called as a member function`,
        j,
      );
      return null;
    }

    const result = processor.process(step, expr, j);
    if (!result.ok) {
      annotatePath(step, result.reason, j);
      return null;
    }

    expr = result.expression;
    importFactories.push(...(processor.imports ?? []));
  }

  return { expression: expr, importFactories };
};

const processInvocation = (
  path: ASTPath<CallExpression>,
  j: JSCodeshift,
): ImportFactory[] | null => {
  const chain = invocationToChain(path, j);
  const parseResult = processMomentFnCall(chain.init, j);
  if (!parseResult) {
    return null;
  }

  const collectedFactories: ImportFactory[] = [...parseResult.imports];

  // +moment(...) or +moment().add(...) etc. — unary plus is implicit .valueOf().
  // The + operator wraps the outermost call in the chain, so check there rather
  // than on the moment() init call itself.
  const chainBreaker = chain.chains.find((p) => {
    const name = getChainCallName(p.node, j);
    return name && getProcessor(name)?.isBreaking;
  });
  const outermostPath = last(chain.chains) ?? path;

  if (isUnaryPlusCoercion(outermostPath, j)) {
    const stepsToProcess = chainBreaker
      ? chain.chains.slice(0, chain.chains.indexOf(chainBreaker) + 1)
      : chain.chains;
    const chainResult = processChainSteps(
      stepsToProcess,
      parseResult.expression,
      j,
    );
    if (chainResult !== null) {
      collectedFactories.push(...chainResult.importFactories);
      if (chainBreaker) {
        const breakerIdx = chain.chains.indexOf(chainBreaker);
        const afterBreaker = chain.chains.slice(breakerIdx + 1);
        let expr = chainResult.expression;
        for (const step of afterBreaker) {
          const callee = step.node.callee;
          if (j.MemberExpression.check(callee)) {
            expr = j.callExpression(
              j.memberExpression(expr, callee.property),
              step.node.arguments,
            );
          }
        }
        const unary = outermostPath.parentPath.node;
        const replacement = j.unaryExpression(unary.operator, expr);
        outermostPath.parentPath.replace(replacement);
      } else {
        const epochMs = j.template.expression`${chainResult.expression}.epochMilliseconds`;
        outermostPath.parentPath.replace(epochMs);
      }
      return collectedFactories;
    }
    return null;
  }

  if (!chainBreaker) {
    annotatePath(
      path,
      "only expressions that evaluate to a primitive or Date can be transformed",
      j,
    );
    return null;
  }

  const subChain = chain.chains.slice(
    0,
    chain.chains.indexOf(chainBreaker) + 1,
  );
  const chainResult = processChainSteps(
    subChain,
    parseResult.expression,
    j,
    { annotateUnsupported: true },
  );
  if (chainResult !== null) {
    collectedFactories.push(...chainResult.importFactories);
    last(subChain)?.replace(chainResult.expression);
    return collectedFactories;
  }
  return null;
};

export default function transform(
  file: FileInfo,
  { j }: API,
  options: Options,
) {
  const source = j(file.source);
  const invocations = findAllMomentFactoryCalls(source, j);
  const usedFactories: ImportFactory[] = [];

  invocations?.forEach((path) => {
    const factories = processInvocation(path, j);
    if (factories !== null) {
      usedFactories.push(...factories);
    }
  });

  addImports(source, resolveImports(usedFactories, j), j);

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
    // Build the dependency map from registered processors plus the parse-phase
    // factories (polyfill and toEpochNanos), which are not processor-owned.
    const dependencyMap = getDependencyMap([
      {
        factory: pollyfillImport,
        npmDeps: ["@js-temporal/polyfill"],
      },
      {
        factory: toEpochNanosImport,
        npmDeps: ["@js-temporal/polyfill", "moment-to-temporal"],
      },
    ]);
    const allFactories = getAllImportFactories().concat([pollyfillImport, toEpochNanosImport]);
    const resolvedImports = resolveImports(usedFactories, j);

    fs.writeFileSync(
      options["resultFilePath"],
      JSON.stringify({
        importsAdded: uniq(
          resolvedImports.flatMap((importDecl) => {
            const matchingFactory = allFactories.find(
              (f) => f(j) === importDecl,
            );
            if (!matchingFactory) return [];
            return dependencyMap.get(matchingFactory) ?? [];
          }),
        ),
      }),
      { encoding: "utf-8" },
    );
    options["importsAdded"]?.("aha");
  }

  return source.toSource(options["printOptions"]);
}
