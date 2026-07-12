import { register } from "../registry";
import { toMomentStringImport } from "../import-factories";

register({
  name: "toString",
  isBreaking: true,
  imports: [toMomentStringImport],
  npmDeps: ["@js-temporal/polyfill", "moment-to-temporal"],
  process(_path, next, j) {
    return {
      ok: true,
      expression: j.template.expression`toMomentString(${next})`,
    };
  },
});
