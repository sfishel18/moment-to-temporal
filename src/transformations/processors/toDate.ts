import { register } from "../registry";
import { toLegacyDateImport } from "../import-factories";

register({
  name: "toDate",
  isBreaking: true,
  imports: [toLegacyDateImport],
  npmDeps: ["@js-temporal/polyfill", "moment-to-temporal"],
  process(_path, next, j) {
    return {
      ok: true,
      expression: j.template.expression`toLegacyDate(${next})`,
    };
  },
});
