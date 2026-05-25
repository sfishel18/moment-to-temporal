import { register } from "../registry";
import { convertDurationArgs } from "../shared/unit-conversion";

register({
  name: "add",
  process(path, next, j) {
    const convertedDuration = convertDurationArgs(path.node.arguments, j);
    if (!convertedDuration.ok) {
      return { ok: false, reason: `failed to transform \`add\`: ${convertedDuration.reason}` };
    }
    return {
      ok: true,
      expression: j.template.expression`${next}.add(${convertedDuration.expression})`,
    };
  },
});
