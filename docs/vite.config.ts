import path from "path";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import plainText from "vite-plugin-plain-text";
import packageJson from '../package.json';

process.env.VITE_META_DESCRIPTION = packageJson.description;
process.env.VITE_META_KEYWORDS = packageJson.keywords.join(', ');

export default defineConfig({
  root: __dirname,
  base: "./",
  plugins: [solidPlugin(), plainText(/\.md$/)],
  define: {
    process: JSON.stringify({ env: {} }),
  },
  optimizeDeps: {
    include: ["@codemirror/state", "@codemirror/view"],
  },
  resolve: {
    alias: {
      // avoid console warnings from vite with `@sinonjs/fake-timers` tries to access the `timers` module
      timers: "identity-obj-proxy",
      "moment-to-temporal/runtime/to-legacy-date": path.resolve(
        __dirname,
        "../src/runtime/to-legacy-date.ts",
      ),
      "moment-to-temporal/runtime/from-string": path.resolve(
        __dirname,
        "../src/runtime/from-string.ts",
      ),
      "moment-to-temporal/runtime/to-formatted-string": path.resolve(
        __dirname,
        "../src/runtime/to-formatted-string.ts",
      ),
    },
  },
});
