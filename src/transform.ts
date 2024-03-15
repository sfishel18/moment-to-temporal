import j, {
  API,
  CallExpression,
  Collection,
  FileInfo,
  JSCodeshift,
  Options,
  ASTPath,
  MemberExpression,
  File,
  Literal,
  StringLiteral,
  ImportDeclaration,
} from "jscodeshift";
import { last, once, uniq } from "lodash";
import {
  findAllMomentDefaultSpecifiers,
  findAllMomentFactoryCalls,
  findAllReferences,
} from "./ast-utils";

type ExpressionObject = MemberExpression["object"];

const pollyfillImport: (j: JSCodeshift) => ImportDeclaration = once(
  (j) => j.template.statement`import { Temporal } from '@js-temporal/polyfill';`
);

const toLegacyDateImport: (j: JSCodeshift) => ImportDeclaration = once(
  (j) =>
    j.template
      .statement`import toLegacyDate from 'moment-to-temporal/runtime/to-legacy-date';`
);

const fromStringImport: (j: JSCodeshift) => ImportDeclaration = once(
  (j) =>
    j.template
      .statement`import fromString from 'moment-to-temporal/runtime/from-string';`
);

const addImports = (
  source: Collection<unknown>,
  imports: ImportDeclaration[],
  j: JSCodeshift
) => {
  const file = source.isOfType(j.File) ? (source as Collection<File>) : null;
  file?.nodes()[0]?.program.body.unshift(...uniq(imports));
};

const processInit = (
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

const unitConversionMap: Partial<Record<string, string>> = {
  ms: "milliseconds",
  s: "seconds",
  m: "minutes",
  h: "hours",
  d: "days",
  w: "weeks",
  M: "months",
  y: "years",
};

const convertUnitArg = (
  unitArg: Literal | StringLiteral,
  j: JSCodeshift
): StringLiteral | null => {
  const value = unitArg.value;
  if (typeof value !== "string") {
    return null;
  }
  if (
    !Object.keys(unitConversionMap).includes(value) &&
    !Object.values(unitConversionMap).includes(value)
  ) {
    return null;
  }
  return j.stringLiteral(unitConversionMap[value] || value);
};

type ChainProcessor = {
  isBreaking?: boolean;
  process: (
    path: ASTPath<CallExpression>,
    next: ExpressionObject,
    imports: ImportDeclaration[],
    j: JSCodeshift
  ) => ExpressionObject | null;
};

const chainProcessors: Partial<Record<string, ChainProcessor>> = {
  toDate: {
    isBreaking: true,
    process: (path, next, imports, j) => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        return null;
      }
      imports.push(toLegacyDateImport(j));
      return j.template.expression`toLegacyDate(${next})`;
    },
  },
  add: {
    process: (path, next, _, j) => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        return null;
      }
      const [amountArg, unitArg] = path.node.arguments;
      if (j.SpreadElement.check(amountArg)) {
        return null;
      }
      if (!j.StringLiteral.check(unitArg) && !j.Literal.check(unitArg)) {
        return null;
      }
      const convertedUnitArg = convertUnitArg(unitArg, j);
      if (!convertedUnitArg) {
        return null;
      }
      return j.template
        .expression`${next}.add({ ${convertedUnitArg}: ${amountArg} })`;
    },
  },
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
  const initReplacement = processInit(chain.init, imports, j);
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
  invocations?.forEach((path) => processInvocation(path, imports, j));
  addImports(source, imports, j);
  findAllMomentDefaultSpecifiers(source, j).forEach((path) => {
    const references = findAllReferences(path, j);
    if (!references || references.size() === 0) {
      j(path).closest(j.ImportDeclaration).remove();
    }
  });
  return source.toSource(options.printOptions);
}
