import { register } from "../registry";
import { instantIsoStringExpression } from "../shared/instant-iso-string";

register({
  name: "toISOString",
  isBreaking: true,
  process(_path, next, j) {
    return {
      ok: true,
      expression: instantIsoStringExpression(next, j),
    };
  },
});
