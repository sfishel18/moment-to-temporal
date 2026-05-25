import { register } from "../registry";

register({
  name: "valueOf",
  isBreaking: true,
  process(_path, next, j) {
    return {
      ok: true,
      expression: j.template.expression`${next}.epochMilliseconds`,
    };
  },
});
