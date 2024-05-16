import path from "path";
import type { Config } from "tailwindcss";

export default {
  content: [
    path.join(__dirname, "index.html"),
    path.join(__dirname, "src/**/*.{ts,tsx}"),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
