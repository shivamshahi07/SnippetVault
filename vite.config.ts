import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import type { ManifestV3Export } from "@crxjs/vite-plugin";

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "Snippet Organizer",
  version: "1.0.0",
  description: "A modern code snippet manager with Supabase integration",
  permissions: [
    "storage",
    "cookies",
    "activeTab",
    "clipboardWrite",
    "identity",
    "webNavigation",
  ],
  host_permissions: [
    "*://localhost/*",
    "*://localhost:3000/*",
    "*://localhost:5173/*",
    "https://*.vercel.app/*",
    "https://*.netlify.app/*",
    "https://*.supabase.co/*",
    "https://snippet-organizer.com/*",
    "https://*.snippet-organizer.com/*",
  ],
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  action: {
    default_popup: "index.html",
    default_icon: "icon.png",
  },
  icons: {
    "128": "icon.png",
  },
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
  },
};

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "esnext",
  },
});
