import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  optimizeDeps: { include: ["react", "react-dom/client"] },
  server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/app-icon.png"],
      manifest: {
        name: "破壁 IELTS 6",
        short_name: "破壁 6",
        description: "每天 30–45 分钟，稳步走向 IELTS General Training 6 分。",
        theme_color: "#0f6f70",
        background_color: "#fbf8f0",
        display: "standalone",
        start_url: "./",
        lang: "zh-CN",
        icons: [{ src: "icons/app-icon.png", sizes: "1024x1024", type: "image/png", purpose: "any maskable" }]
      },
      workbox: { globPatterns: ["**/*.{js,css,html,png,woff2}"] }
    })
  ]
});
