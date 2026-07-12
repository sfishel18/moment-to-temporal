/**
 * Loads all processor files from the `processors/` directory. Each file
 * calls `register()` as a side effect, populating the registry. Importing
 * this module must happen before any transform invocations.
 *
 * Processors are imported explicitly rather than discovered by scanning the
 * directory at runtime: dynamic `require` escapes the module pipeline of
 * bundlers and vite-based test runners. When adding a new processor, add an
 * import here.
 */
import "./processors/add";
import "./processors/clone";
import "./processors/diff";
import "./processors/endOf";
import "./processors/format";
import "./processors/startOf";
import "./processors/subtract";
import "./processors/toDate";
import "./processors/toISOString";
import "./processors/toJSON";
import "./processors/toString";
import "./processors/unix";
import "./processors/valueOf";
