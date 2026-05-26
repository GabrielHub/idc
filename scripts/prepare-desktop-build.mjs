import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT_DIR = process.cwd();
const BUILD_CLIENT_DIR = resolve(ROOT_DIR, "build/client");
const INDEX_HTML = resolve(BUILD_CLIENT_DIR, "index.html");
const SPA_FALLBACK_HTML = resolve(BUILD_CLIENT_DIR, "__spa-fallback.html");

if (!existsSync(INDEX_HTML)) {
  throw new Error("Desktop build is missing build/client/index.html.");
}

if (!existsSync(SPA_FALLBACK_HTML)) {
  throw new Error("Desktop build is missing build/client/__spa-fallback.html.");
}

const indexHtml = readFileSync(INDEX_HTML, "utf8");

if (!indexHtml.includes('"routes/home"')) {
  throw new Error("Desktop index.html is missing the home route module.");
}

copyFileSync(INDEX_HTML, SPA_FALLBACK_HTML);
console.log("Desktop SPA fallback normalized to prerendered index.html.");
