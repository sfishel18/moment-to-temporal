import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  root: __dirname,
  base: "./",
  plugins: [solidPlugin()],
  define: {
    process: JSON.stringify({ env: {} }),
  },
  optimizeDeps: {
    include: ["@codemirror/state", "@codemirror/view"],
  },
});
