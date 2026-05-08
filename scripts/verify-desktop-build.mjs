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
