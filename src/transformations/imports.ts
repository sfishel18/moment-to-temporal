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

export const fromStringImport: (j: JSCodeshift) => ImportDeclaration = once(
  (j) =>
    j.template
      .statement`import fromString from 'moment-to-temporal/runtime/from-string';`,
);

export const toFormattedStringImport: (j: JSCodeshift) => ImportDeclaration =
  once(
    (j) =>
      j.template
        .statement`import toFormattedString from 'moment-to-temporal/runtime/to-formatted-string'`,
  );

export const allImports = [
  pollyfillImport,
  toLegacyDateImport,
  fromStringImport,
  toFormattedStringImport,
];

export const importDependencyMap: Map<unknown, string[]> = new Map([
  [pollyfillImport, ["@js-temporal/polyfill"]],
  [toLegacyDateImport, ["@js-temporal/polyfill", "moment-to-temporal"]],
  [fromStringImport, ["@js-temporal/polyfill", "moment-to-temporal"]],
  [toFormattedStringImport, ["@js-temporal/polyfill", "moment-to-temporal"]],
]);
