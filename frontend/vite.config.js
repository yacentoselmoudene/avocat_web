import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_PROXY_TARGET ;
  if (env.NODE_ENV === "development") {
  console.log("Running locally");
} else {
  console.log("Running in production");
}
   console.log(target + " target ");
  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api":   { target, changeOrigin: true, secure: false },
        "/media": { target, changeOrigin: true, secure: false },
      },
    },
  };
});
