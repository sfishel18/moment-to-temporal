import { annotatePath } from "../ast-utils";
import { ChainProcessor } from "../types";
import { toFormattedStringImport, toLegacyDateImport } from "./imports";

const chainProcessors: Record<string, ChainProcessor> = {
  toDate: {
    isBreaking: true,
    process: (path, next, imports, j) => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        annotatePath(
          path,
          `failed to transform \`toDate\`: not called as a member function`,
          j,
        );
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
        annotatePath(
          path,
          `failed to transform \`toISOString\`: not called as a member function`,
          j,
        );
        return null;
      }
      return j.template
        .expression`
${next}.toInstant().round({ smallestUnit: 'millisecond', roundingMode: 'floor' }).toString()
// regexery to always pad with trailing zeros
.replace(/([.]\\d{0,3})?Z$/, (_, m) => (m || '.').padEnd(4, '0') + 'Z')
`;
    },
  },
  format: {
    isBreaking: true,
    process: (path, next, imports, j) => {
      const callee = path.node.callee;
      if (!j.MemberExpression.check(callee)) {
        annotatePath(
          path,
          `failed to transform \`format\`: not called as a member function`,
          j,
        );
        return null;
      }
      imports.push(toFormattedStringImport(j));
      const args = path.node.arguments;
      return j.template.expression`toFormattedString(${next}, ${args[0]})`;
    },
  },
};

export default chainProcessors;
