import { register } from "../registry";
import { convertUnitArg, notRoundableUnits } from "../shared/unit-conversion";

register({
  name: "endOf",
  process(path, next, j) {
    const [unitArg] = path.node.arguments;
    if (j.SpreadElement.check(unitArg)) {
      return { ok: false, reason: "failed to transform `endOf`: spread operator not supported" };
    }
    if (!j.StringLiteral.check(unitArg) && !j.Literal.check(unitArg)) {
      return { ok: false, reason: "failed to transform `endOf`: unit is not a string literal" };
    }
    const convertedUnit = convertUnitArg(unitArg, j);
    if (!convertedUnit.ok) {
      return { ok: false, reason: `failed to transform \`endOf\`: ${convertedUnit.reason}` };
    }
    if (
      !convertedUnit.expression.value ||
      notRoundableUnits.includes(convertedUnit.expression.value)
    ) {
      return {
        ok: false,
        reason: `failed to transform \`endOf\`: unit "${convertedUnit.expression.value}" does not support rounding`,
      };
    }
    return {
      ok: true,
      expression: j.template
        .expression`${next}.round({ smallestUnit: ${convertedUnit.expression}, roundingMode: 'ceil' }).subtract({ milliseconds: 1 })`,
    };
  },
});
