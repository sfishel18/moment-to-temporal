import { ChainProcessor } from "../types";
import { toFormattedStringImport, toLegacyDateImport } from "./imports";

const chainProcessors: Record<string, ChainProcessor> = {
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
  toISOString: {
    isBreaking: true,
    process: (path, next, _, j) => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        return null;
      }
      return j.template.expression`${next}.toString()`;
    },
  },
  format: {
    isBreaking: true,
    process: (path, next, imports, j) => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        return null;
      }
      imports.push(toFormattedStringImport(j));
      const args = path.node.arguments;
      return j.template.expression`toFormattedString(${next}, ${args[0]})`;
    },
  },
};

export default chainProcessors;
