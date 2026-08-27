import { defineConfig } from "vite";
import { seedDesignPlugin } from "@seed-design/vite-plugin";

export default defineConfig({
  base: "./",
  plugins: [seedDesignPlugin()],
});
