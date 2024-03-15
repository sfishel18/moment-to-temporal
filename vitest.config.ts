import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "moment-to-temporal/runtime/to-legacy-date": path.resolve(
        __dirname,
        "src/runtime/to-legacy-date.ts"
      ),
      "moment-to-temporal/runtime/from-string": path.resolve(
        __dirname,
        "src/runtime/from-string.ts"
      ),
    },
  },
});
