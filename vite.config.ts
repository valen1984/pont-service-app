import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "react-native": "react-native-web",
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000", // 👈 redirige todo /api al backend
    },
  },
});