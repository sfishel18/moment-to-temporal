import { register } from "../registry";
import { convertDurationArgs } from "../shared/unit-conversion";

register({
  name: "subtract",
  process(path, next, j) {
    const convertedDuration = convertDurationArgs(path.node.arguments, j);
    if (!convertedDuration.ok) {
      return { ok: false, reason: `failed to transform \`subtract\`: ${convertedDuration.reason}` };
    }
    return {
      ok: true,
      expression: j.template.expression`${next}.subtract(${convertedDuration.expression})`,
    };
  },
});
