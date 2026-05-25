import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DEFAULT_MEMBER_ROSTER_FILTER_STATE } from "../../services/member-roster-filter";
import { LobbyHudLayer } from "./lobby-hud-layer";
import type { FlythroughLayer, LobbyState } from "./types";

// Tests run under the node environment (no jsdom installed), so we render to
// HTML strings and inspect them. The assertions stay structural (find a
// button by its visible label, check disabled attribute) rather than
// pixel-level — useEffect doesn't fire here, but the rendered HUD layout is
// driven by props alone and exercises the gating logic we care about.

describe("LobbyHudLayer AI warmup gating", () => {
  it("keeps Commit pair available while AI is not ready", () => {
    const html = renderHud({ aiReady: false, lobbyState: "partner_selected" });
    const commitButton = findButtonByLabel(html, "Commit pair");

    expect(commitButton).toBeDefined();
    expect(hasDisabledAttribute(commitButton)).toBe(false);
    expect(html).not.toContain("AI not ready");
  });

  it("keeps Begin date visible but blocked while AI is not ready", () => {
    const html = renderHud({
      aiReady: false,
      lobbyState: "scenario_chosen",
      selectedScenarioId: "orbital-tea-room",
    });
    const beginButton = findButtonByLabel(html, "Begin date");

    expect(beginButton).toBeDefined();
    expect(hasDisabledAttribute(beginButton)).toBe(true);
    expect(html).toContain("AI not ready");
  });

  it("blocks Begin and Commit with a Working… reason while an action is in flight", () => {
    const html = renderHud({
      aiReady: true,
      isActionPending: true,
      lobbyState: "scenario_chosen",
      selectedScenarioId: "orbital-tea-room",
    });
    const beginButton = findButtonByLabel(html, "Begin date");

    expect(beginButton).toBeDefined();
    expect(hasDisabledAttribute(beginButton)).toBe(true);
    expect(html).toContain("Working…");
    expect(html).not.toContain("AI not ready");
  });

  it("drops the redundant 'Pair locked' label when a Begin reason supersedes it", () => {
    const html = renderHud({
      aiReady: false,
      lobbyState: "scenario_chosen",
      selectedScenarioId: "orbital-tea-room",
    });

    expect(html).toContain("AI not ready");
    expect(html).not.toContain("Pair locked");
  });
});

describe("LobbyHudLayer Records pill gating", () => {
  it("hides the Records pill until the first shift is filed", () => {
    const html = renderHud({
      aiReady: true,
      lobbyState: "partner_selected",
      hasFiledShift: false,
      viewMode: "tonight",
    });

    expect(html).not.toContain("Open records");
  });

  it("shows the Records pill once at least one shift has been filed", () => {
    const html = renderHud({
      aiReady: true,
      lobbyState: "partner_selected",
      hasFiledShift: true,
      viewMode: "tonight",
    });

    expect(html).toContain("Open records");
  });

  it("shows the Records pill when pair graph records exist before shift filing", () => {
    const html = renderHud({
      aiReady: true,
      lobbyState: "partner_selected",
      hasFiledShift: false,
      archiveEdgeCount: 1,
      viewMode: "tonight",
    });

    expect(html).toContain("Open records");
  });
});

function renderHud({
  aiReady,
  isActionPending = false,
  lobbyState,
  selectedScenarioId = null,
  hasFiledShift = false,
  archiveEdgeCount = 0,
  viewMode = "archive",
}: {
  aiReady: boolean;
  isActionPending?: boolean;
  lobbyState: LobbyState;
  selectedScenarioId?: string | null;
  hasFiledShift?: boolean;
  archiveEdgeCount?: number;
  viewMode?: "archive" | "tonight";
}): string {
  const currentLayer: FlythroughLayer = 1;

  return renderToString(
    <LobbyHudLayer
      viewMode={viewMode}
      currentLayer={currentLayer}
      layerNavigationMode="free"
      refs={{
        layerIndicatorRef: createRef<HTMLDivElement>(),
        layerFocusRef: createRef<HTMLButtonElement>(),
        layerRosterRef: createRef<HTMLButtonElement>(),
        layerCathedralRef: createRef<HTMLButtonElement>(),
        sideRailRef: createRef<HTMLDivElement>(),
        intentRailRef: createRef<HTMLDivElement>(),
        beginButtonRef: createRef<HTMLButtonElement>(),
        fileShiftButtonRef: createRef<HTMLButtonElement>(),
        contextualRailRef: createRef<HTMLDivElement>(),
        dateBookPillRef: createRef<HTMLButtonElement>(),
        closureCalloutRef: createRef<HTMLDivElement>(),
      }}
      focus={undefined}
      partner={undefined}
      callouts={[]}
      lobbyState={lobbyState}
      selectedScenarioId={selectedScenarioId}
      isActionPending={isActionPending}
      aiReady={aiReady}
      shiftBriefRows={[]}
      scenarioMode="auto"
      bookingLocked={false}
      deckRepairBlocked={false}
      rosterSubview="eligibles"
      filterState={DEFAULT_MEMBER_ROSTER_FILTER_STATE}
      canReselect={false}
      archiveEdgeCount={archiveEdgeCount}
      archiveSelectionActive={false}
      hasFiledShift={hasFiledShift}
      onLayerSelect={() => undefined}
      onCommitPair={() => undefined}
      onBeginDate={() => undefined}
      onCancelPair={() => undefined}
      onCompleteShift={() => undefined}
      onOpenNotes={() => undefined}
      onOpenShiftArchive={() => undefined}
      onToggleDateBook={() => undefined}
      onOpenLens={() => undefined}
      onToggleReselect={() => undefined}
      onRosterSubviewChange={() => undefined}
      onToggleArchive={() => undefined}
    />,
  );
}

/**
 * Pull the first `<button …>…</button>` tag whose inner content (visible
 * text + any nested element text) contains `label`. Tolerates icon
 * wrappers, attribute reordering, and whitespace differences — when a
 * designer adds a span around the label, the test should still find it
 * instead of breaking with a brittle regex anchor.
 */
function findButtonByLabel(html: string, label: string): string {
  const buttonRegex = /<button\b[^>]*>([\s\S]*?)<\/button>/g;
  for (const match of html.matchAll(buttonRegex)) {
    const inner = stripTags(match[1] ?? "");
    if (normalize(inner) === normalize(label)) {
      return match[0];
    }
  }
  throw new Error(`Expected to find button "${label}".`);
}

function hasDisabledAttribute(buttonTag: string): boolean {
  return /\sdisabled(?:=|\s|\/?>)/.test(buttonTag);
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
