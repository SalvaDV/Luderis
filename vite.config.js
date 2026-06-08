/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Migración CRA → Vite (Fase 6 arquitectura).
// Estrategia de bajo churn: NO se tocan los `process.env.REACT_APP_*` del código
// fuente; se resuelven acá con `define`. Las env vars de Vercel siguen llamándose
// igual (REACT_APP_*) y `loadEnv` también las toma del process.env del build.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "REACT_APP_");
  const isProd = mode === "production";

  return {
    plugins: [react()],

    // Reemplazos estáticos para mantener el código fuente sin cambios.
    define: {
      "process.env.NODE_ENV": JSON.stringify(isProd ? "production" : "development"),
      "process.env.PUBLIC_URL": JSON.stringify(""),
      "process.env.REACT_APP_SUPABASE_URL": JSON.stringify(env.REACT_APP_SUPABASE_URL || ""),
      "process.env.REACT_APP_SUPABASE_KEY": JSON.stringify(env.REACT_APP_SUPABASE_KEY || ""),
      "process.env.REACT_APP_ADMIN_EMAIL": JSON.stringify(env.REACT_APP_ADMIN_EMAIL || ""),
      "process.env.REACT_APP_VAPID_PUBLIC": JSON.stringify(env.REACT_APP_VAPID_PUBLIC || ""),
      "process.env.REACT_APP_STRIPE_PK": JSON.stringify(env.REACT_APP_STRIPE_PK || ""),
    },

    server: { port: 3000, open: false },

    build: {
      // Mantener la estructura de CRA para no tocar vercel.json (rewrites/headers/CSP).
      outDir: "build",
      assetsDir: "static",
      sourcemap: false,
    },

    // Vitest (reemplaza react-scripts test / Jest).
    test: {
      globals: true,
      environment: "node",
      include: ["src/**/*.{test,spec}.{js,jsx}"],
    },
  };
});
