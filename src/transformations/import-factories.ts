import { JSCodeshift, ImportDeclaration } from "jscodeshift";
import { once } from "lodash";

// Each factory is wrapped with `once` so calls within a single jscodeshift
// transform invocation always return the same AST node reference. This lets
// `lodash/uniq` deduplicate imports by reference equality when multiple
// processors in one chain need the same import.

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

export const toEpochNanosImport: (j: JSCodeshift) => ImportDeclaration = once(
  (j) =>
    j.template
      .statement`import toEpochNanos from 'moment-to-temporal/runtime/to-epoch-nanos';`,
);
