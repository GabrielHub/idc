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

describe("LobbyHudLayer Cupid warmup gating", () => {
  it("keeps Commit pair available while Cupid is still booting", () => {
    const html = renderHud({ aiReady: false, lobbyState: "partner_selected" });
    const commitButton = findButtonByLabel(html, "Commit pair");

    expect(commitButton).toBeDefined();
    expect(hasDisabledAttribute(commitButton)).toBe(false);
    expect(html).not.toContain("Cupid is still booting");
  });

  it("keeps Begin date visible but blocked while Cupid is still booting", () => {
    const html = renderHud({
      aiReady: false,
      lobbyState: "scenario_chosen",
      selectedScenarioId: "orbital-tea-room",
    });
    const beginButton = findButtonByLabel(html, "Begin date");

    expect(beginButton).toBeDefined();
    expect(hasDisabledAttribute(beginButton)).toBe(true);
    expect(html).toContain("Cupid is still booting");
  });

  it("blocks Begin and Commit with a filing reason while an action is in flight", () => {
    const html = renderHud({
      aiReady: true,
      isActionPending: true,
      lobbyState: "scenario_chosen",
      selectedScenarioId: "orbital-tea-room",
    });
    const beginButton = findButtonByLabel(html, "Begin date");

    expect(beginButton).toBeDefined();
    expect(hasDisabledAttribute(beginButton)).toBe(true);
    expect(html).toContain("Cupid is filing");
    expect(html).not.toContain("Cupid is still booting");
  });

  it("drops the redundant 'Pair locked' label when a Begin reason supersedes it", () => {
    const html = renderHud({
      aiReady: false,
      lobbyState: "scenario_chosen",
      selectedScenarioId: "orbital-tea-room",
    });

    expect(html).toContain("Cupid is still booting");
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

describe("LobbyHudLayer Date Book pill gating", () => {
  it("hides the Date Book pill before deck editing unlocks", () => {
    const html = renderHud({
      aiReady: true,
      lobbyState: "partner_selected",
      viewMode: "tonight",
      showDateBook: false,
      dateBookDisabledReason: "Date Book edits unlock after the first date report.",
    });

    expect(html).not.toContain("Date Book");
  });

  it("shows the Date Book pill after deck editing unlocks", () => {
    const html = renderHud({
      aiReady: true,
      lobbyState: "partner_selected",
      viewMode: "tonight",
      showDateBook: true,
    });

    expect(html).toContain("Date Book");
  });

  it("keeps the visible Date Book pill disabled while a booking is active", () => {
    const html = renderHud({
      aiReady: true,
      lobbyState: "scenario_chosen",
      selectedScenarioId: "orbital-tea-room",
      viewMode: "tonight",
      showDateBook: true,
      bookingLocked: true,
    });
    const dateBookButton = findButtonByLabel(html, "Date Book");

    expect(hasDisabledAttribute(dateBookButton)).toBe(true);
  });
});

describe("LobbyHudLayer focus swap affordance", () => {
  it("surfaces the reselect action as visible swap copy on roster layers", () => {
    const html = renderHud({
      aiReady: true,
      lobbyState: "focus_selected",
      viewMode: "tonight",
      canReselect: true,
    });

    expect(html).toContain("Swap cases");
    expect(findButtonByLabel(html, "Swap cases")).toBeDefined();
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
  showDateBook = true,
  bookingLocked = false,
  dateBookDisabledReason,
  canReselect = false,
}: {
  aiReady: boolean;
  isActionPending?: boolean;
  lobbyState: LobbyState;
  selectedScenarioId?: string | null;
  hasFiledShift?: boolean;
  archiveEdgeCount?: number;
  viewMode?: "archive" | "tonight";
  showDateBook?: boolean;
  bookingLocked?: boolean;
  dateBookDisabledReason?: string;
  canReselect?: boolean;
}): string {
  const currentLayer: FlythroughLayer = 1;

  return renderToString(
    <LobbyHudLayer
      viewMode={viewMode}
      currentLayer={currentLayer}
      layerNavigationMode="free"
      refs={{
        layerIndicatorRef: createRef<HTMLDivElement>(),
        shiftBriefRef: createRef<HTMLDivElement>(),
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
      shiftBrief={{
        leadAsk: { kind: "empty" },
        goals: { summary: "None assigned", summaryStatus: "met", items: [] },
        gates: {
          closure: { value: "None ready", status: "met" },
          followUp: { value: "Clear", status: "met" },
          fileShift: { value: "Ready", status: "met" },
        },
      }}
      scenarioMode="auto"
      showDateBook={showDateBook}
      bookingLocked={bookingLocked}
      dateBookDisabledReason={dateBookDisabledReason}
      deckRepairBlocked={false}
      rosterSubview="eligibles"
      filterState={DEFAULT_MEMBER_ROSTER_FILTER_STATE}
      canReselect={canReselect}
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
 * Pull the first `<button …>…</button>` tag whose inner content matches
 * `label`, falling back to the button's `aria-label` for icon-only buttons
 * (e.g. the roster Swap cases pill, which carries its label as an aria
 * attribute rather than visible text).
 */
function findButtonByLabel(html: string, label: string): string {
  const buttonRegex = /<button\b[^>]*>([\s\S]*?)<\/button>/g;
  const target = normalize(label);
  for (const match of html.matchAll(buttonRegex)) {
    const tag = match[0];
    const inner = stripTags(match[1] ?? "");
    if (normalize(inner) === target) return tag;
    const ariaLabel = /\saria-label="([^"]*)"/.exec(tag)?.[1];
    if (ariaLabel !== undefined && normalize(ariaLabel) === target) return tag;
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
