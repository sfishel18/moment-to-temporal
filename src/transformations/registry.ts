import { JSCodeshift, ImportDeclaration } from "jscodeshift";
import { uniq } from "lodash";
import { ChainProcessor, ImportFactory } from "../types";

export type ProcessorRegistration = {
  name: string;
  isBreaking?: boolean;
  /** Import factories this processor needs injected when it runs successfully. */
  imports?: ImportFactory[];
  /** npm packages required by this processor's runtime imports (for CLI reporting). */
  npmDeps?: string[];
  process: ChainProcessor["process"];
};

type RegisteredProcessor = ProcessorRegistration & {
  isBreaking: boolean;
};

const processorMap = new Map<string, RegisteredProcessor>();

/**
 * Register a chain processor. Called as a side effect when each processor
 * module is loaded. The registry is module-level state, so registration
 * persists for the lifetime of the process.
 */
export function register(reg: ProcessorRegistration): void {
  processorMap.set(reg.name, {
    ...reg,
    isBreaking: reg.isBreaking ?? false,
  });
}

/** Look up a registered processor by Moment.js method name. */
export function getProcessor(name: string): RegisteredProcessor | undefined {
  return processorMap.get(name);
}

/**
 * Given the import factories collected from all processors that ran
 * successfully in a transform pass, return deduplicated AST import
 * declaration nodes ready to prepend to the file.
 */
export function resolveImports(
  factories: ImportFactory[],
  j: JSCodeshift,
): ImportDeclaration[] {
  return uniq(factories.map((f) => f(j)));
}

/**
 * All import factories across all registered processors, plus any extras
 * passed in (e.g. from parse.ts). Used by the CLI result-file reporter to
 * enumerate which npm packages a transformed file depends on.
 */
export function getAllImportFactories(): ImportFactory[] {
  const seen = new Set<ImportFactory>();
  Array.from(processorMap.values()).forEach((proc) => {
    (proc.imports ?? []).forEach((f) => seen.add(f));
  });
  return Array.from(seen);
}

/**
 * Build a map from each import factory to the npm packages it pulls in.
 * Derived from the registered processors' `npmDeps` declarations.
 * Always includes `@js-temporal/polyfill` for every factory since all
 * transformed code requires it.
 */
export function getDependencyMap(
  extras: Array<{ factory: ImportFactory; npmDeps: string[] }>,
): Map<ImportFactory, string[]> {
  const map = new Map<ImportFactory, string[]>();
  Array.from(processorMap.values()).forEach((proc) => {
    (proc.imports ?? []).forEach((factory) => {
      map.set(factory, proc.npmDeps ?? []);
    });
  });
  extras.forEach(({ factory, npmDeps }) => {
    map.set(factory, npmDeps);
  });
  return map;
}
