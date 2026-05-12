import { describe, expect, it } from "vitest";

import { isSfxEnabledByDefault } from "./sfx-provider";

describe("SFX provider defaults", () => {
  it("starts enabled in the desktop runtime", () => {
    expect(isSfxEnabledByDefault("tauri")).toBe(true);
  });

  it("starts muted in the browser runtime", () => {
    expect(isSfxEnabledByDefault("browser")).toBe(false);
  });
});
