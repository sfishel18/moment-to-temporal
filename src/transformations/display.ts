import { ChainProcessor } from "../types";
import { toLegacyDateImport } from "./imports";

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
};

export default chainProcessors;
