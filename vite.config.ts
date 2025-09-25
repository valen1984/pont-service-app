import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "react-native": "react-native-web", // 👈 fuerza a usar RN web
    },
  },
  server: {
    port: 5173, // 👈 front en dev
    proxy: {
      "/api": {
        target: "http://localhost:3000", // 👈 backend en dev
        changeOrigin: true,
      },
    },
  },
});