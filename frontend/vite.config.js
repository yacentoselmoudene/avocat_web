// vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env   = loadEnv(mode, process.cwd(), "");
  const isDev = mode === "development";
  const target = env.VITE_PROXY_TARGET || "http://127.0.0.1:8000";

  return {
    plugins: [react()],
    base: "/",                 // si l'app est servie à la racine du domaine
    server: isDev
      ? {
          host: true,          // accessible sur le LAN si besoin
          proxy: {
            "/api":   { target, changeOrigin: true, secure: false },
            "/media": { target, changeOrigin: true, secure: false },
          },
        }
      : undefined,             // ❗ aucun proxy en production
    build: {
      sourcemap: false,        // en prod, pas de sourcemaps (optionnel)
      outDir: "dist",
    },
    preview: {
      // uniquement pour `vite preview` local
      proxy: isDev ? undefined : undefined,
    },
  };
});
