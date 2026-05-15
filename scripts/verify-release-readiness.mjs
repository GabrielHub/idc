import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = resolve(fileURLToPath(import.meta.url), "..");
const ROOT_DIR = resolve(SCRIPT_DIR, "..");
const PACKAGE_JSON_PATH = resolve(ROOT_DIR, "package.json");
const TAURI_CONF_PATH = resolve(ROOT_DIR, "src-tauri/tauri.conf.json");
const CARGO_TOML_PATH = resolve(ROOT_DIR, "src-tauri/Cargo.toml");
const CARGO_LOCK_PATH = resolve(ROOT_DIR, "src-tauri/Cargo.lock");
const RELEASE_NOTES_PATH = resolve(ROOT_DIR, "app/fixtures/release-notes.json");
const PLAYER_README_PATH = resolve(ROOT_DIR, "docs/support/release-readme.md");
const DESKTOP_ALPHA_URL =
  "https://github.com/GabrielHub/idc/releases/download/desktop-alpha/latest.json";

const args = parseArgs(process.argv.slice(2));
const packageJson = readJson(PACKAGE_JSON_PATH, "package.json");
const tauriConf = readJson(TAURI_CONF_PATH, "src-tauri/tauri.conf.json");
const packageVersion = readString(packageJson.version);
const releaseTag = readOption(args, "tag") ?? process.env.RELEASE_TAG ?? `v${packageVersion}`;
const installerName = `IDC_${packageVersion}_x64-setup.exe`;
const failures = [];

verifyReleaseTag(failures, releaseTag, packageVersion);
verifyReleaseIdentity(failures, packageVersion, tauriConf);
verifyUpdaterConfig(failures, tauriConf);
verifyReleaseNotesCatalog(failures, packageVersion);
verifySupportReadme(failures);

if (failures.length > 0) {
  throw new Error(
    ["Release readiness failed.", ...failures.map((failure) => `  ${failure}`)].join("\n"),
  );
}

const updaterNotes = runNode([
  "scripts/render-release-notes.mjs",
  "--format",
  "updater",
  "--version",
  packageVersion,
]);

if (updaterNotes.trim().length === 0) {
  throw new Error(`Release readiness failed: updater notes rendered empty for ${packageVersion}.`);
}

runNode([
  "scripts/render-release-notes.mjs",
  "--format",
  "github",
  "--version",
  packageVersion,
  "--tag",
  releaseTag,
  "--installer",
  installerName,
  "--sha256",
  "0".repeat(64),
]);

verifyManifestCanRender({
  packageVersion,
  releaseTag,
  installerName,
  updaterNotes,
});

console.log(`Release readiness passed for ${releaseTag}.`);

function verifyReleaseTag(failureBucket, tag, version) {
  if (!/^v\d+\.\d+\.\d+$/u.test(tag)) {
    failureBucket.push(`release tag must look like v0.2.1. Got: ${tag}`);
    return;
  }

  const expectedTag = `v${version}`;
  if (tag !== expectedTag) {
    failureBucket.push(
      `release tag ${tag} does not match package.json version ${version}. Expected ${expectedTag}.`,
    );
  }
}

function verifyReleaseIdentity(failureBucket, version, tauriConfig) {
  const tauriVersion = readString(tauriConfig.version);
  const cargoVersion = readCargoVersion(CARGO_TOML_PATH);
  const cargoLockVersion = readCargoLockPackageVersion(CARGO_LOCK_PATH, "idc");

  if (version === "") {
    failureBucket.push("release identity: package.json version is missing");
  }

  if (version !== tauriVersion || version !== cargoVersion || version !== cargoLockVersion) {
    failureBucket.push(
      [
        "release identity: version drift",
        `package=${version || "(missing)"}`,
        `tauri=${tauriVersion || "(missing)"}`,
        `cargo=${cargoVersion || "(missing)"}`,
        `lock=${cargoLockVersion || "(missing)"}`,
      ].join(" "),
    );
  }

  const windowTitle = readString(tauriConfig.app?.windows?.[0]?.title);
  if (!windowTitle.includes(version)) {
    failureBucket.push(`release identity: Tauri window title does not include version ${version}`);
  }
}

function verifyUpdaterConfig(failureBucket, tauriConfig) {
  if (tauriConfig.bundle?.createUpdaterArtifacts !== true) {
    failureBucket.push("updater config: bundle.createUpdaterArtifacts must be true");
  }

  const endpoints = tauriConfig.plugins?.updater?.endpoints;
  if (!Array.isArray(endpoints) || !endpoints.includes(DESKTOP_ALPHA_URL)) {
    failureBucket.push(`updater config: endpoints must include ${DESKTOP_ALPHA_URL}`);
  }
}

function verifyReleaseNotesCatalog(failureBucket, version) {
  const catalog = readJson(RELEASE_NOTES_PATH, "app/fixtures/release-notes.json");

  if (!Array.isArray(catalog)) {
    failureBucket.push("release notes: catalog must be an array");
    return;
  }

  const versions = new Map();
  for (const [index, entry] of catalog.entries()) {
    const noteVersion = readString(entry?.version);
    if (noteVersion === "") {
      failureBucket.push(`release notes: entry ${index} is missing a version`);
      continue;
    }
    versions.set(noteVersion, (versions.get(noteVersion) ?? 0) + 1);
  }

  const currentVersionCount = versions.get(version) ?? 0;
  if (currentVersionCount !== 1) {
    failureBucket.push(
      `release notes: expected exactly one public note for ${version}, found ${currentVersionCount}`,
    );
  }

  for (const [noteVersion, count] of versions.entries()) {
    if (count > 1) {
      failureBucket.push(`release notes: duplicate catalog version ${noteVersion}`);
    }
  }
}

function verifySupportReadme(failureBucket) {
  if (!existsSync(PLAYER_README_PATH)) {
    failureBucket.push("release assets: docs/support/release-readme.md is missing");
  }
}

function verifyManifestCanRender({ packageVersion, releaseTag, installerName, updaterNotes }) {
  const tempRoot =
    process.env.RUNNER_TEMP === undefined
      ? resolve(ROOT_DIR, "build/release-preflight")
      : resolve(process.env.RUNNER_TEMP, "idc-release-preflight");
  const signaturePath = resolve(tempRoot, `${installerName}.sig`);
  const manifestPath = resolve(tempRoot, "latest.json");

  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(signaturePath, "release-readiness-signature\n", "utf8");

  runNode(["scripts/create-updater-manifest.mjs"], {
    IDC_RELEASE_TAG: releaseTag,
    IDC_UPDATER_NOTES: updaterNotes,
    IDC_UPDATER_WINDOWS_SIGNATURE: signaturePath,
    IDC_UPDATER_MANIFEST: manifestPath,
    IDC_UPDATER_WINDOWS_ASSET: installerName,
    IDC_RELEASE_ASSET_BASE_URL: `https://github.com/GabrielHub/idc/releases/download/${releaseTag}`,
  });

  const manifest = readJson(manifestPath, "generated latest.json");
  const windowsUpdate = manifest.platforms?.["windows-x86_64"];
  if (manifest.version !== packageVersion) {
    throw new Error(
      `Release readiness failed: latest.json version ${manifest.version} does not match ${packageVersion}.`,
    );
  }
  if (
    windowsUpdate?.url !==
    `https://github.com/GabrielHub/idc/releases/download/${releaseTag}/${installerName}`
  ) {
    throw new Error(`Release readiness failed: latest.json points at ${windowsUpdate?.url}.`);
  }
  if (readString(windowsUpdate?.signature) === "") {
    throw new Error("Release readiness failed: latest.json is missing the Windows signature.");
  }
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Could not read ${label}: ${error.message}`);
  }
}

function readCargoVersion(path) {
  const text = readFileSync(path, "utf8");
  return /^\s*version\s*=\s*"([^"]+)"/mu.exec(text)?.[1] ?? "";
}

function readCargoLockPackageVersion(path, packageName) {
  const text = readFileSync(path, "utf8");
  const blocks = text.split(/\n\[\[package\]\]\n/u);

  for (const block of blocks) {
    const name = /^\s*name\s*=\s*"([^"]+)"/mu.exec(block)?.[1] ?? "";
    if (name !== packageName) {
      continue;
    }
    return /^\s*version\s*=\s*"([^"]+)"/mu.exec(block)?.[1] ?? "";
  }

  return "";
}

function runNode(nodeArgs, extraEnv = {}) {
  try {
    return execFileSync(process.execPath, nodeArgs, {
      cwd: ROOT_DIR,
      encoding: "utf8",
      env: { ...process.env, ...extraEnv },
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const stdout = typeof error.stdout === "string" ? error.stdout.trim() : "";
    const stderr = typeof error.stderr === "string" ? error.stderr.trim() : "";
    throw new Error(
      [`Command failed: node ${nodeArgs.join(" ")}`, stdout, stderr].filter(Boolean).join("\n"),
    );
  }
}

function readString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseArgs(values) {
  const options = new Map();

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) {
      continue;
    }

    const withoutPrefix = value.slice(2);
    const nextValue = values[index + 1];
    if (nextValue !== undefined && !nextValue.startsWith("--")) {
      options.set(withoutPrefix, nextValue);
      index += 1;
    } else {
      options.set(withoutPrefix, "true");
    }
  }

  return options;
}

function readOption(options, key) {
  const value = options.get(key);
  return typeof value === "string" ? value : undefined;
}
