import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      // The OAuth surface is on the backend too: the provider flow KiCad's Remote
      // Symbols panel uses, and the session handoff behind "Continue as <user>".
      // vite.config.panel.ts has always proxied both; this one only had /api, so
      // every /oauth/* request through the dev server 404d.
      "/oauth": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      // The Remote Symbols panel is a separate app the backend serves, and the
      // provider metadata points KiCad at PUBLIC_BASE_URL, which in dev is this
      // server. Without this, /remote-provider/panel hit the SPA catch-all and
      // KiCad opened the main web UI instead of the panel.
      "/remote-provider": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      // The discovery document KiCad reads before anything else, to find
      // panel_url and the auth metadata. It is on the backend as well.
      "/.well-known": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "framework"
          }
          if (
            id.includes("node_modules/react-markdown") ||
            id.includes("node_modules/remark-gfm") ||
            id.includes("node_modules/rehype-raw") ||
            id.includes("node_modules/github-markdown-css")
          ) {
            return "markdown-runtime"
          }
          if (
            id.includes("node_modules/@radix-ui/") ||
            id.includes("node_modules/radix-ui/") ||
            id.includes("node_modules/sonner")
          ) {
            return "ui-runtime"
          }
          if (id.includes("node_modules/lucide-react")) {
            return "icons-runtime"
          }
          if (id.includes("node_modules/online-3d-viewer")) {
            return "viewer3d-runtime"
          }
          if (id.includes("node_modules/three")) {
            return "three-runtime"
          }
          if (id.includes("node_modules")) {
            return "vendor"
          }
        },
      },
    },
  },
})
