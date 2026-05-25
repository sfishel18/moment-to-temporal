import { register } from "../registry";
import { toFormattedStringImport } from "../import-factories";

register({
  name: "format",
  isBreaking: true,
  imports: [toFormattedStringImport],
  npmDeps: ["@js-temporal/polyfill", "moment-to-temporal"],
  process(path, next, j) {
    const args = path.node.arguments;
    return {
      ok: true,
      expression: j.template.expression`toFormattedString(${next}, ${args[0]})`,
    };
  },
});
