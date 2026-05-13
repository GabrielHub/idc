import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(SCRIPT_DIR, "..");
const packageJsonPath = resolve(ROOT_DIR, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const version = packageJson.version;

if (typeof version !== "string" || version.length === 0) {
  throw new Error("package.json version is missing.");
}

const releaseTag = process.env.IDC_RELEASE_TAG ?? `v${version}`;
const windowsAssetName = process.env.IDC_UPDATER_WINDOWS_ASSET ?? `IDC_${version}_x64-setup.exe`;
const assetBaseUrl =
  process.env.IDC_RELEASE_ASSET_BASE_URL ??
  `https://github.com/GabrielHub/idc/releases/download/${releaseTag}`;
const signaturePath = resolve(
  ROOT_DIR,
  process.env.IDC_UPDATER_WINDOWS_SIGNATURE ??
    `src-tauri/target/release/bundle/nsis/${windowsAssetName}.sig`,
);
const outputPath = resolve(
  ROOT_DIR,
  process.env.IDC_UPDATER_MANIFEST ?? "src-tauri/target/release/bundle/nsis/latest.json",
);
const notes = process.env.IDC_UPDATER_NOTES ?? `IDC v${version}`;

let signature;
try {
  signature = readFileSync(signaturePath, "utf8").trim();
} catch (error) {
  if (error.code === "ENOENT") {
    throw new Error(`Updater signature not found: ${signaturePath}`);
  }
  throw error;
}

if (signature.length === 0) {
  throw new Error(`Updater signature is empty: ${signaturePath}`);
}

const manifest = {
  version,
  notes,
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature,
      url: `${assetBaseUrl}/${windowsAssetName}`,
    },
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
