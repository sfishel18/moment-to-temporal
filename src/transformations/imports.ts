import { ImportDeclaration, JSCodeshift } from "jscodeshift";
import { once } from "lodash";

export const pollyfillImport: (j: JSCodeshift) => ImportDeclaration = once(
  (j) =>
    j.template.statement`import { Temporal } from '@js-temporal/polyfill';`,
);

export const toLegacyDateImport: (j: JSCodeshift) => ImportDeclaration = once(
  (j) =>
    j.template
      .statement`import toLegacyDate from 'moment-to-temporal/runtime/to-legacy-date';`,
);

export const toFormattedStringImport: (j: JSCodeshift) => ImportDeclaration =
  once(
    (j) =>
      j.template
        .statement`import toFormattedString from 'moment-to-temporal/runtime/to-formatted-string';`,
  );

export const toEpochNanosImport: (j: JSCodeshift) => ImportDeclaration =
  once(
    (j) =>
      j.template
        .statement`import toEpochNanos from 'moment-to-temporal/runtime/to-epoch-nanos';`,
  );

export const allImports = [
  pollyfillImport,
  toLegacyDateImport,
  toFormattedStringImport,
  toEpochNanosImport
];

export const importDependencyMap: Map<unknown, string[]> = new Map([
  [pollyfillImport, ["@js-temporal/polyfill"]],
  [toLegacyDateImport, ["@js-temporal/polyfill", "moment-to-temporal"]],
  [toFormattedStringImport, ["@js-temporal/polyfill", "moment-to-temporal"]],
  [toEpochNanosImport, ["@js-temporal/polyfill", "moment-to-temporal"]],
]);
