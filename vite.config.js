import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync } from "fs";

// Copia os ficheiros da PWA (que estão na raiz do repositório) para o build final.
const copyPwaFiles = () => ({
  name: "copy-pwa-files",
  closeBundle() {
    const files = ["manifest.webmanifest", "icon-192.png", "icon-512.png"];
    for (const f of files) {
      if (existsSync(f)) {
        try {
          copyFileSync(f, `dist/${f}`);
        } catch (e) {
          console.warn("Não foi possível copiar", f, e.message);
        }
      }
    }
  },
});

export default defineConfig({
  plugins: [react(), copyPwaFiles()],
});

