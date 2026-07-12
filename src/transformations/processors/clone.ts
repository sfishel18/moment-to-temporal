import { register } from "../registry";

register({
  name: "clone",
  // Temporal objects are immutable, so cloning is a no-op: the expression
  // built so far passes through unchanged.
  process(_path, next, _j) {
    return {
      ok: true,
      expression: next,
    };
  },
});
