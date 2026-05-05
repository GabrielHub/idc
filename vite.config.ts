import { existsSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const PUBLIC_PORTRAIT_SOURCE_DIR = "public/assets/portraits/source";

export default defineConfig({
  plugins: [forbidPublicPortraitSources(), tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
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
          "Move them to assets-source/portraits so they are not shipped to the client.",
          "Found:",
          listedFiles,
        ].join("\n"),
      );
    },
  };
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
