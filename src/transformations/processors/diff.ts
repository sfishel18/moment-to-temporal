import { register } from "../registry";
import { diffImport } from "../import-factories";
import { convertUnitArg } from "../shared/unit-conversion";

register({
  name: "diff",
  isBreaking: true,
  imports: [diffImport],
  npmDeps: ["@js-temporal/polyfill", "moment-to-temporal"],
  process(path, next, j) {
    const [otherArg, unitArg, floatArg] = path.node.arguments;
    if (!otherArg) {
      return {
        ok: false,
        reason: "failed to transform `diff`: an argument is required",
      };
    }
    if (j.SpreadElement.check(otherArg)) {
      return {
        ok: false,
        reason: "failed to transform `diff`: spread arguments are not supported",
      };
    }
    const helperArgs = [next, otherArg];
    if (unitArg) {
      if (!j.StringLiteral.check(unitArg) && !j.Literal.check(unitArg)) {
        return {
          ok: false,
          reason: "failed to transform `diff`: unit is not a string literal",
        };
      }
      const convertedUnit = convertUnitArg(unitArg, j);
      if (!convertedUnit.ok) {
        return {
          ok: false,
          reason: `failed to transform \`diff\`: ${convertedUnit.reason}`,
        };
      }
      helperArgs.push(convertedUnit.expression);
      if (floatArg) {
        if (j.SpreadElement.check(floatArg)) {
          return {
            ok: false,
            reason:
              "failed to transform `diff`: the float flag cannot be a spread argument",
          };
        }
        helperArgs.push(floatArg);
      }
    }
    return {
      ok: true,
      expression: j.callExpression(
        j.identifier("diffZonedDateTime"),
        helperArgs,
      ),
    };
  },
});
