import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
    proxy: { '/api': { target: `http://127.0.0.1:${process.env.AI_PORT || 8787}`, changeOrigin: true } },
  },
});
