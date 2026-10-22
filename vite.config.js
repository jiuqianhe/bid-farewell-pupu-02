import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const outputRoot = resolve(projectRoot, "dist");

function copyPrototypeFiles() {
  return {
    name: "copy-prototype-static-files",
    closeBundle() {
      mkdirSync(outputRoot, { recursive: true });
      for (const file of ["使用说明.txt", "打开网页.html"]) {
        const source = resolve(projectRoot, file);
        if (existsSync(source)) cpSync(source, resolve(outputRoot, file));
      }
    }
  };
}

export default defineConfig({
  base: "/",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  plugins: [copyPrototypeFiles()]
});
