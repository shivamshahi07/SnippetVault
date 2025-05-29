import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import type { ManifestV3Export } from "@crxjs/vite-plugin";

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "Snippet Organizer",
  version: "1.0.0",
  description: "A modern code snippet manager with Supabase integration",
  permissions: ["storage", "clipboardWrite", "identity"],
  action: {
    default_popup: "index.html",
    default_icon: "icon.png",
  },
  icons: {
    "128": "icon.png",
  },
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  host_permissions: ["https://*.supabase.co/*"],
} as const;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
      },
      output: {
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});
