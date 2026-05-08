import { existsSync, readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const ROOT_DIR = process.cwd();
const BUILD_CLIENT_DIR = resolve(ROOT_DIR, "build/client");
const REQUIRED_FILES = ["index.html", "__spa-fallback.html"];
const SCANNED_EXTENSIONS = new Set([".css", ".html", ".js", ".json", ".mjs"]);
const FORBIDDEN_PATTERNS = [
  { label: "API route artifact", pattern: /routes\/api\.|api\.game|api\.playground/u },
  {
    label: "playground artifact",
    pattern: /routes\/playground|Component workshop|AI prompt bench|UI Playground/u,
  },
  { label: ".server artifact", pattern: /\.server[./]/u },
  { label: "Gateway environment key", pattern: /AI_GATEWAY_API_KEY/u },
];

const failures = [];
const releaseIdentity = loadReleaseIdentity();

verifyReleaseIdentity(failures, releaseIdentity);
verifyCopyrightAttestation(failures, releaseIdentity);

for (const filePath of REQUIRED_FILES) {
  const absolutePath = resolve(BUILD_CLIENT_DIR, filePath);

  if (!existsSync(absolutePath)) {
    failures.push(`missing ${filePath}`);
  }
}

for (const filePath of findFiles(BUILD_CLIENT_DIR)) {
  if (!shouldScan(filePath)) {
    continue;
  }

  const text = readFileSync(filePath, "utf8");

  for (const entry of FORBIDDEN_PATTERNS) {
    if (entry.pattern.test(text)) {
      failures.push(`${entry.label} in ${relative(ROOT_DIR, filePath).replaceAll("\\", "/")}`);
    }
  }
}

if (failures.length > 0) {
  throw new Error(
    ["Desktop build verification failed.", ...failures.map((failure) => `  ${failure}`)].join("\n"),
  );
}

console.log("Desktop build verification passed.");

function findFiles(directoryPath) {
  if (!existsSync(directoryPath)) {
    return [];
  }

  const files = [];

  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = resolve(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...findFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function shouldScan(filePath) {
  return [...SCANNED_EXTENSIONS].some((extension) => filePath.endsWith(extension));
}

function loadReleaseIdentity() {
  const packageJsonPath = resolve(ROOT_DIR, "package.json");
  const tauriConfPath = resolve(ROOT_DIR, "src-tauri/tauri.conf.json");
  const cargoTomlPath = resolve(ROOT_DIR, "src-tauri/Cargo.toml");

  if (!existsSync(packageJsonPath) || !existsSync(tauriConfPath) || !existsSync(cargoTomlPath)) {
    return null;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const tauriConf = JSON.parse(readFileSync(tauriConfPath, "utf8"));
  const cargoToml = readFileSync(cargoTomlPath, "utf8");
  const cargoVersionMatch = /\n\s*version\s*=\s*"([^"]+)"/u.exec(`\n${cargoToml}`);

  return {
    packageJson,
    tauriConf,
    cargoVersion: cargoVersionMatch === null ? null : cargoVersionMatch[1],
  };
}

function verifyReleaseIdentity(failureBucket, identity) {
  if (identity === null) {
    return;
  }

  const { packageJson, tauriConf, cargoVersion } = identity;
  const packageVersion = packageJson.version;
  const tauriVersion = tauriConf.version;

  if (
    typeof packageVersion !== "string" ||
    typeof tauriVersion !== "string" ||
    typeof cargoVersion !== "string"
  ) {
    failureBucket.push(
      "release identity: version missing in package.json, tauri.conf.json, or Cargo.toml",
    );
    return;
  }

  if (packageVersion !== tauriVersion || packageVersion !== cargoVersion) {
    failureBucket.push(
      `release identity: version drift package=${packageVersion} tauri=${tauriVersion} cargo=${cargoVersion}`,
    );
  }

  const tauriTitle = tauriConf.app?.windows?.[0]?.title;
  if (typeof tauriTitle !== "string" || !tauriTitle.includes(packageVersion)) {
    failureBucket.push(
      `release identity: tauri.conf.json window title does not include version ${packageVersion}`,
    );
  }
}

function verifyCopyrightAttestation(failureBucket, identity) {
  if (process.env.IDC_RELEASE_PREFLIGHT !== "1" || identity === null) {
    return;
  }

  const copyright = identity.tauriConf.bundle?.copyright;
  const currentYear = new Date().getUTCFullYear();
  const expectedYearFragment = String(currentYear);

  if (typeof copyright !== "string" || copyright.length === 0) {
    failureBucket.push("release preflight: bundle.copyright is missing in tauri.conf.json");
    return;
  }

  if (!copyright.includes(expectedYearFragment)) {
    failureBucket.push(
      `release preflight: bundle.copyright "${copyright}" does not include current year ${expectedYearFragment}`,
    );
  }

  if (process.env.IDC_COPYRIGHT_CONFIRMED !== copyright) {
    failureBucket.push(
      `release preflight: bundle.copyright "${copyright}" was not confirmed for signing. Set IDC_COPYRIGHT_CONFIRMED to the exact copyright string before running with IDC_RELEASE_PREFLIGHT=1.`,
    );
  }
}
