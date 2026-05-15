import { existsSync, readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";
import { configDefaults, defineConfig } from "vite-plus";

const PUBLIC_PORTRAIT_SOURCE_DIR = "public/assets/portraits/source";
const FORBIDDEN_DESKTOP_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "api route entries", pattern: /\/routes\/api\.[\w.-]+\.ts/ },
  { label: "playground route entries", pattern: /\/routes\/playground\.tsx/ },
  { label: ".server chunks", pattern: /\.server[./]/ },
  { label: "AI Gateway environment key", pattern: /AI_GATEWAY_API_KEY/ },
];

const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
  version: string;
};
const APP_VERSION = packageJson.version;
const CHUNK_TARGET_BYTES = 420 * 1024;

export default defineConfig({
  run: {
    tasks: {
      verify: {
        command: "vp check && vp test && vp build",
        input: [{ auto: true }, "!build/**", "!node_modules/.vite/task-cache/**"],
      },
      "audit:dates": {
        command: "node scripts/audit-dates.mjs",
      },
    },
  },
  staged: {
    "*": () => "vp run verify",
  },
  plugins: [
    forbidPublicPortraitSources(),
    tailwindcss(),
    reactRouter(),
    scrubDesktopBundleText(),
    inspectDesktopBundle(),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 32 * 1024,
          groups: [
            {
              name: "react-vendor",
              test: /node_modules[\\/](?:@react-router|react|react-dom|react-router)[\\/]/,
              priority: 50,
            },
            {
              name: "motion-vendor",
              test: /node_modules[\\/]motion[\\/]/,
              priority: 40,
            },
            {
              name: "ai-vendor",
              test: /node_modules[\\/](?:@ai-sdk|ai|ai-sdk-ollama|zod)[\\/]/,
              priority: 30,
              maxSize: CHUNK_TARGET_BYTES,
            },
            {
              name: "game-domain",
              test: /[\\/]app[\\/]domain[\\/]/,
              priority: 25,
              minSize: 0,
            },
            {
              name: "fixture-data",
              test: /[\\/]app[\\/]fixtures[\\/]/,
              priority: 20,
              maxSize: CHUNK_TARGET_BYTES,
            },
            {
              name: "game-services",
              test: /[\\/]app[\\/]services[\\/]/,
              priority: 10,
              maxSize: CHUNK_TARGET_BYTES,
            },
            {
              name: "dashboard-ui",
              test: /[\\/]app[\\/]components[\\/]/,
              priority: 5,
              maxSize: CHUNK_TARGET_BYTES,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: "node",
    exclude: [
      ...configDefaults.exclude,
      "**/.claude/**",
      "**/.expect/**",
      "**/.playwright-mcp/**",
      "**/.react-router/**",
      "**/build/**",
    ],
    setupFiles: ["./app/test/llm-network-guard.ts"],
    server: {
      deps: {
        inline: ["ai", "@opentelemetry/api"],
      },
    },
  },
});

function forbidPublicPortraitSources(): Plugin {
  return {
    name: "idc-forbid-public-portrait-sources",
    configResolved(config) {
      const files = findFiles(resolve(config.root, PUBLIC_PORTRAIT_SOURCE_DIR));

      if (files.length === 0) {
        return;
      }

      const listedFiles = files
        .map((filePath) => `  ${relative(config.root, filePath).replaceAll("\\", "/")}`)
        .join("\n");

      throw new Error(
        [
          "Portrait source files cannot be placed under public/assets/portraits/source.",
          "Move them to assets-source/portraits/<member-id> so they are not shipped to the client.",
          "Found:",
          listedFiles,
        ].join("\n"),
      );
    },
  };
}

function scrubDesktopBundleText(): Plugin {
  let isDesktopBuild = false;

  return {
    name: "idc-scrub-desktop-bundle-text",
    apply: "build",
    configResolved(config) {
      isDesktopBuild = config.mode === "desktop";
    },
    renderChunk(code) {
      if (!isDesktopBuild) {
        return null;
      }

      const scrubbedCode = code.replaceAll("AI_GATEWAY_API_KEY", "Gateway runtime key");

      return scrubbedCode === code ? null : { code: scrubbedCode, map: null };
    },
  };
}

function inspectDesktopBundle(): Plugin {
  let isDesktopBuild = false;
  let buildClientDir = "";

  return {
    name: "idc-inspect-desktop-bundle",
    apply: "build",
    configResolved(config) {
      isDesktopBuild = config.mode === "desktop";
      buildClientDir = resolve(config.root, "build/client");
    },
    closeBundle() {
      if (!isDesktopBuild) {
        return;
      }

      const manifestPath = resolve(buildClientDir, ".vite/manifest.json");

      if (!existsSync(manifestPath)) {
        return;
      }

      const manifestText = readFileSync(manifestPath, "utf8");
      const manifestViolations = scanText(manifestText);
      const assetViolations = scanAssetFiles(buildClientDir);
      const allViolations = [...manifestViolations, ...assetViolations];

      if (allViolations.length === 0) {
        return;
      }

      throw new Error(
        [
          "Desktop bundle inspection failed.",
          "These artifacts must not appear in a desktop build:",
          ...allViolations.map((violation) => `  - ${violation}`),
        ].join("\n"),
      );
    },
  };
}

function scanText(text: string): string[] {
  return FORBIDDEN_DESKTOP_PATTERNS.filter((entry) => entry.pattern.test(text)).map(
    (entry) => entry.label,
  );
}

function scanAssetFiles(buildClientDir: string): string[] {
  const violations = new Set<string>();
  const files = findFiles(buildClientDir).filter(
    (filePath) => filePath.endsWith(".js") || filePath.endsWith(".mjs"),
  );

  for (const filePath of files) {
    const text = readFileSync(filePath, "utf8");

    for (const entry of FORBIDDEN_DESKTOP_PATTERNS) {
      if (entry.pattern.test(text)) {
        const relativePath = relative(buildClientDir, filePath).replaceAll("\\", "/");
        violations.add(`${entry.label} in ${relativePath}`);
      }
    }
  }

  return [...violations];
}

function findFiles(directoryPath: string): string[] {
  if (!existsSync(directoryPath)) {
    return [];
  }

  const files: string[] = [];

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
