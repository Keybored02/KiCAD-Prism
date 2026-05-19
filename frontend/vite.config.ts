import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // gerbers-renderer doesn't expose its CSS in the package exports map;
      // alias the subpath directly to the filesystem file so Vite can resolve it.
      "gerbers-renderer/dist/gerbers-renderer.css": path.resolve(
        __dirname,
        "node_modules/gerbers-renderer/dist/gerbers-renderer.css"
      ),
    },
  },
  server: {
    proxy: {
      "/api": {
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
            id.includes("node_modules/@base-ui/") ||
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
