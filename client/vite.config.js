import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Any request to /api on the client will go to the backend dev server
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});