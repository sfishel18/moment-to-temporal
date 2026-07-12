import { JSCodeshift } from "jscodeshift";
import { ExpressionObject } from "../../types";

// Moment's .toISOString() and .toJSON() both produce the same UTC ISO 8601
// string with exactly three fractional digits ("2018-10-18T04:19:00.000Z").
export const instantIsoStringExpression = (
  next: ExpressionObject,
  j: JSCodeshift,
): ExpressionObject =>
  j.template.expression`
${next}.toInstant().round({ smallestUnit: 'millisecond', roundingMode: 'floor' }).toString()
// regexery to always pad with trailing zeros
.replace(/([.]\\d{0,3})?Z$/, (_, m) => (m || '.').padEnd(4, '0') + 'Z')
`;
