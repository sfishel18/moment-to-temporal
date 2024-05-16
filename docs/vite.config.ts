import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  root: __dirname,
  plugins: [solidPlugin()],
});
