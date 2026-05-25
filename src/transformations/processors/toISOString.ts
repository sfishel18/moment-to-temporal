import { register } from "../registry";

register({
  name: "toISOString",
  isBreaking: true,
  process(_path, next, j) {
    return {
      ok: true,
      expression: j.template.expression`
${next}.toInstant().round({ smallestUnit: 'millisecond', roundingMode: 'floor' }).toString()
// regexery to always pad with trailing zeros
.replace(/([.]\\d{0,3})?Z$/, (_, m) => (m || '.').padEnd(4, '0') + 'Z')
`,
    };
  },
});
