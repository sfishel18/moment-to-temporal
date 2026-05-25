import { register } from "../registry";
import { convertUnitArg, notRoundableUnits } from "../shared/unit-conversion";

register({
  name: "startOf",
  process(path, next, j) {
    const [unitArg] = path.node.arguments;
    if (j.SpreadElement.check(unitArg)) {
      return { ok: false, reason: "failed to transform `startOf`: spread operator not supported" };
    }
    if (!j.StringLiteral.check(unitArg) && !j.Literal.check(unitArg)) {
      return { ok: false, reason: "failed to transform `startOf`: unit is not a string literal" };
    }
    const convertedUnit = convertUnitArg(unitArg, j);
    if (!convertedUnit.ok) {
      return { ok: false, reason: `failed to transform \`startOf\`: ${convertedUnit.reason}` };
    }
    if (
      !convertedUnit.expression.value ||
      notRoundableUnits.includes(convertedUnit.expression.value)
    ) {
      return {
        ok: false,
        reason: `failed to transform \`startOf\`: unit "${convertedUnit.expression.value}" does not support rounding`,
      };
    }
    return {
      ok: true,
      expression: j.template
        .expression`${next}.round({ smallestUnit: ${convertedUnit.expression}, roundingMode: 'floor' })`,
    };
  },
});
