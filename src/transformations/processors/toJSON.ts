import { register } from "../registry";
import { instantIsoStringExpression } from "../shared/instant-iso-string";

register({
  name: "toJSON",
  isBreaking: true,
  process(_path, next, j) {
    return {
      ok: true,
      expression: instantIsoStringExpression(next, j),
    };
  },
});
