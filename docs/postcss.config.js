import path from "path";
import { fileURLToPath } from "url";

export default {
  plugins: {
    tailwindcss: {
      config: path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "./tailwind.config.ts"
      ),
    },
    autoprefixer: {},
  },
};
