import { defineConfig } from "vite";

// The dashboard calls same-origin /api/*; Vite forwards it to the official server.
// Point PRALAYA_API_URL at another machine (e.g. http://192.168.1.20:8000) to use a teammate's server.
const target = process.env.PRALAYA_API_URL ?? "http://127.0.0.1:8000";
// 5317 avoids Vite's default 5173, which other local tools often hold. Override with PRALAYA_UI_PORT.
const port = Number(process.env.PRALAYA_UI_PORT ?? 5317);

export default defineConfig({
  server: {
    port,
    strictPort: true,
    proxy: {
      "/api": { target, changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, "") },
    },
  },
  preview: {
    port: port + 1,
    proxy: {
      "/api": { target, changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, "") },
    },
  },
});
