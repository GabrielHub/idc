import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(SCRIPT_DIR, "..");
const CATALOG_PATH = resolve(ROOT_DIR, "app/fixtures/release-notes.json");
const PACKAGE_JSON_PATH = resolve(ROOT_DIR, "package.json");
const FORBIDDEN_DASH_PATTERN = /[\u2013\u2014]/u;

const args = parseArgs(process.argv.slice(2));
const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8"));
const catalog = readCatalog();
const format = readOption(args, "format") ?? "github";
const version = normalizeVersion(
  readOption(args, "version") ?? process.env.IDC_RELEASE_NOTES_VERSION ?? packageJson.version,
);
const tag = readOption(args, "tag") ?? process.env.IDC_RELEASE_TAG ?? `v${version}`;
const installer = readOption(args, "installer") ?? process.env.IDC_RELEASE_INSTALLER ?? "";
const sha256 = readOption(args, "sha256") ?? process.env.IDC_RELEASE_SHA256 ?? "";
const outputPath = readOption(args, "output") ?? process.env.IDC_RELEASE_NOTES_OUTPUT ?? "";
const extraNotes = readOption(args, "extra") ?? process.env.IDC_RELEASE_EXTRA_NOTES ?? "";

const note = catalog.find((entry) => entry.version === version);
if (note === undefined) {
  throw new Error(
    `Missing public release notes for ${version}. Add an entry to app/fixtures/release-notes.json before publishing.`,
  );
}

const rendered =
  format === "github"
    ? renderGithubReleaseNotes({ note, tag, installer, sha256, extraNotes })
    : format === "updater"
      ? renderUpdaterNotes(note)
      : throwUnsupportedFormat(format);

if (outputPath.length > 0) {
  mkdirSync(dirname(resolve(ROOT_DIR, outputPath)), { recursive: true });
  writeFileSync(resolve(ROOT_DIR, outputPath), `${rendered}\n`, "utf8");
} else {
  process.stdout.write(`${rendered}\n`);
}

function readCatalog() {
  const parsed = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));

  if (!Array.isArray(parsed)) {
    throw new Error("Release notes catalog must be an array.");
  }

  return parsed.map((entry, index) => validateReleaseNote(entry, index));
}

function validateReleaseNote(value, index) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Release note ${index} must be an object.`);
  }

  const record = value;
  const versionValue = validateText(record.version, `release note ${index} version`);
  if (!/^\d+\.\d+\.\d+$/u.test(versionValue)) {
    throw new Error(`Release note ${index} version must look like 0.2.5.`);
  }

  const date = validateText(record.date, `release note ${versionValue} date`);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date)) {
    throw new Error(`Release note ${versionValue} date must look like 2026-05-13.`);
  }

  const sections = record.sections;
  if (!Array.isArray(sections) || sections.length === 0) {
    throw new Error(`Release note ${versionValue} needs at least one section.`);
  }

  return {
    version: versionValue,
    date,
    headline: validateText(record.headline, `release note ${versionValue} headline`),
    summary: validateText(record.summary, `release note ${versionValue} summary`),
    sections: sections.map((section, sectionIndex) =>
      validateSection(section, versionValue, sectionIndex),
    ),
  };
}

function validateSection(value, versionValue, index) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Release note ${versionValue} section ${index} must be an object.`);
  }

  const items = value.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(`Release note ${versionValue} section ${index} needs at least one item.`);
  }

  return {
    title: validateText(value.title, `release note ${versionValue} section ${index} title`),
    items: items.map((item, itemIndex) =>
      validateText(item, `release note ${versionValue} section ${index} item ${itemIndex}`),
    ),
  };
}

function validateText(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  if (FORBIDDEN_DASH_PATTERN.test(value)) {
    throw new Error(`${label} must not contain en or em dashes.`);
  }
  return value.trim();
}

function renderGithubReleaseNotes({ note, tag, installer, sha256, extraNotes }) {
  if (installer.trim().length === 0) {
    throw new Error("GitHub release notes require --installer or IDC_RELEASE_INSTALLER.");
  }
  if (sha256.trim().length === 0) {
    throw new Error("GitHub release notes require --sha256 or IDC_RELEASE_SHA256.");
  }

  const lines = [
    `# IDC ${tag} test alpha`,
    "",
    note.summary,
    "",
    "## Artifact",
    "",
    `- Windows installer: \`${installer.trim()}\``,
    `- SHA256: \`${sha256.trim()}\``,
    "",
    ...renderMarkdownSections(note.sections),
    "## Install notes",
    "",
    "This is an unsigned private alpha. Windows may show SmartScreen. Choose More info, then Run anyway if you trust this release.",
    "",
    "IDC needs either local Ollama or Vercel AI Gateway before you can book dates.",
    "",
    "Install notes are attached as release-readme.md.",
  ];

  const trimmedExtra = extraNotes.trim();
  if (trimmedExtra.length > 0) {
    if (FORBIDDEN_DASH_PATTERN.test(trimmedExtra)) {
      throw new Error("Extra release notes must not contain en or em dashes.");
    }
    lines.push("", "## Operator notes", "", trimmedExtra);
  }

  return lines.join("\n");
}

function renderUpdaterNotes(note) {
  return [
    `IDC v${note.version}: ${note.headline}`,
    "",
    note.summary,
    "",
    ...renderMarkdownSections(note.sections),
  ]
    .join("\n")
    .trim();
}

function renderMarkdownSections(sections) {
  const lines = [];

  for (const section of sections) {
    lines.push(`## ${section.title}`, "");
    for (const item of section.items) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  return lines;
}

function normalizeVersion(versionValue) {
  return versionValue.trim().replace(/^v/u, "");
}

function parseArgs(values) {
  const options = new Map();

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) {
      continue;
    }

    const withoutPrefix = value.slice(2);
    const equalsIndex = withoutPrefix.indexOf("=");
    if (equalsIndex !== -1) {
      options.set(withoutPrefix.slice(0, equalsIndex), withoutPrefix.slice(equalsIndex + 1));
      continue;
    }

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

function throwUnsupportedFormat(formatValue) {
  throw new Error(`Unsupported release notes format: ${formatValue}`);
}
