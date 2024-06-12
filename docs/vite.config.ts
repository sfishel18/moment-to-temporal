import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import plainText from "vite-plugin-plain-text";

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
});
