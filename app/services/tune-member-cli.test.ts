import { execFile } from "node:child_process";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

type TuneRun = {
  code: number;
  stdout: string;
  stderr: string;
};

const PROJECT_ROOT = process.cwd();
const SCRIPT_PATH = resolve(PROJECT_ROOT, "scripts/tune-member.mjs");

function runTune(args: readonly string[]): Promise<TuneRun> {
  return new Promise((resolveRun) => {
    execFile(
      process.execPath,
      [SCRIPT_PATH, ...args],
      {
        cwd: PROJECT_ROOT,
        encoding: "utf8",
        env: { ...process.env, NO_COLOR: "1" },
      },
      (error, stdout, stderr) => {
        if (error !== null) {
          resolveRun({
            code: typeof error.code === "number" ? error.code : 1,
            stdout,
            stderr,
          });
          return;
        }

        resolveRun({ code: 0, stdout, stderr });
      },
    );
  });
}

describe("tune-member CLI", () => {
  it("rejects missing start flag values before creating a tune session", async () => {
    const result = await runTune(["start", "cassie-conners", "--partner"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("--partner requires a value.");
  });

  it("rejects session names that could escape the tune directory", async () => {
    const result = await runTune(["start", "cassie-conners", "--name", "../escape"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      "Tune session names may use letters, numbers, dots, underscores, and hyphens only.",
    );
  });
});
