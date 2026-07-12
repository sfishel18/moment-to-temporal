import { register } from "../registry";

register({
  name: "unix",
  isBreaking: true,
  process(_path, next, j) {
    // Moment rounds toward negative infinity (Math.floor), not toward zero —
    // the two differ for pre-epoch timestamps with fractional seconds.
    return {
      ok: true,
      expression: j.template
        .expression`Math.floor(${next}.epochMilliseconds / 1000)`,
    };
  },
});
