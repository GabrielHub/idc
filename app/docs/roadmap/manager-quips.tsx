import {
  Chip,
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocDefList,
  DocLink,
  DocList,
  DocPage,
  DocTable,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";
import { ManagerQuipPreview } from "../../components/manager-quip-preview";
import {
  RoadmapAcceptance,
  RoadmapChecklist,
  RoadmapDecisionsLog,
  RoadmapFileRef,
  RoadmapPlanHeader,
  type RoadmapTaskItem,
} from "../../components/roadmap-primitives";
import { type RoadmapPlanMeta } from "../../services/roadmap-content";

export const meta: DocMeta = {
  slug: "roadmap/manager-quips",
  group: "roadmap",
  title: "Manager check-in quips",
  description:
    "Voiced manager standee at named gameplay beats. Pre-generated ElevenLabs audio, autoplay through the SFX provider, graceful fail when files are missing.",
  order: 10,
};

export const plan: RoadmapPlanMeta = {
  status: "drafting",
  opened: "2026-05-14",
  touched: "2026-05-14",
  owner: "unassigned",
  tldr: "Promote the tutorial manager into a sparse reactive standee. She rises from below at named gameplay beats and autoplays a one-line ElevenLabs voice clip.",
  tasks: 16,
  done: 0,
  tags: ["ui", "audio", "tutorial-adjacent", "voice"],
};

export const lede = (
  <>
    The tutorial manager is the only character who speaks to the player directly. Members live
    inside the simulation; she stands on the operator's side of the screen. This plan keeps her on
    after onboarding as a sparse, voiced presence: she rises from the bottom of the screen as a
    standee, plays a one-line clip, and drops back down. No card, no bubble, no buttons. Audio is
    pre-generated through ElevenLabs (Lyan) and shipped as static files under{" "}
    <DocCode>public/assets/manager-quips/</DocCode>. The visual works without audio, so we can ship
    the trigger flow before the recording sweep finishes.
  </>
);

const PLAN_SLUG = "roadmap/manager-quips";

const PREVIEW_SECTION: DocSectionEntry = {
  id: "preview",
  title: "Interactive preview",
  body: (
    <>
      <P>
        Cycle through the catalog and play any line. The preview requests audio only for entries
        marked recorded. Draft lines have no files yet, so the visual fires by itself. Runtime
        wiring still has to handle missing files without throwing.
      </P>
      <ManagerQuipPreview />
      <DocCallout variant="note" title="See the full catalog">
        <P>
          The complete inventory, voice rules, and authoring workflow live in the product doc at{" "}
          <DocLink to="/docs/product/manager-quips">Manager check-in quips</DocLink>. The plan below
          covers the wiring and acceptance bar for shipping it.
        </P>
      </DocCallout>
    </>
  ),
};

const TRIGGER_SECTION: DocSectionEntry = {
  id: "triggers",
  title: "Trigger taxonomy",
  body: (
    <>
      <P>
        Sparseness is the design. She is not a reaction layer over every stat shift. She fires for
        moments the game has already paused to mark. Three frequency lanes, applied as global rate
        limits before any individual trigger fires.
      </P>
      <DocTable
        headers={["Lane", "Cadence", "Examples"]}
        rows={[
          [
            <Chip key="rare" tone="violet">
              Rare
            </Chip>,
            "Once or twice per save. Hard caps. Always fires.",
            "Soft-win cutscene at five closures. Member quit. First focus-case swap.",
          ],
          [
            <Chip key="reg" tone="rose">
              Regular
            </Chip>,
            "At most once per shift. Dedupes against itself.",
            "Date started. Date wrapped. Bad-fit outcome. Cool-down filed. Closure confirmed. Retention dips below 25.",
          ],
          [
            <Chip key="epi" tone="amber">
              Episodic
            </Chip>,
            "May fire mid-shift but never twice in the same surface.",
            "Date ended early. Pair trajectory turns brittle. Date Book over budget at commit.",
          ],
        ]}
      />
      <DocCallout variant="warn" title="Hard skip list">
        <P>
          These look tempting and are wrong. Document the exclusion so the next agent does not
          relitigate.
        </P>
        <DocList
          items={[
            "Judge snapshots mid-date. They fire every six turns and already have their own panel.",
            "Every stat gain. The roster already animates these.",
            "Agreement creation. Multiple per date and already filed on the pair memory inspector.",
            "Follow-up recommendations. The wrap screen already surfaces them.",
            "Scenario card draws. Routine planning, not a beat.",
          ]}
        />
      </DocCallout>
    </>
  ),
};

const CONTRACT_SECTION: DocSectionEntry = {
  id: "contract",
  title: "Contract",
  body: (
    <>
      <P>
        This feature is a presentation surface fed by gameplay events. It owns no rules and no save
        state beyond an ephemeral last-fired log for rate limiting. Boundaries follow the same
        layers as the rest of the app.
      </P>
      <DocDefList
        items={[
          {
            term: <DocCode>app/fixtures/manager-quips.ts</DocCode>,
            def: "New. The catalog (id, trigger key, text, audio path, status, cadence). Currently inline in the preview component; move here during implementation so the future service and the product doc can both import it without depending on a component file.",
          },
          {
            term: <DocCode>app/services/manager-quips.ts</DocCode>,
            def: "New. The resolver (event kind to quip id) and the rate limiter. Pure functions, no DOM.",
          },
          {
            term: <DocCode>app/components/sfx-provider.tsx</DocCode>,
            def: "Edit. Add playVoiceClip(path) to the context so the popup plays through the same gain node, mute state, and volume preference as every other cue. Silent fail on missing files.",
          },
          {
            term: <DocCode>app/components/manager-quip-popup.tsx</DocCode>,
            def: "New. The runtime popup. Mounts under the shell as a fixed bottom-anchored standee, animates up, calls playVoiceClip on entrance settle, auto-dismisses after the audio (or after a fallback timeout when no audio).",
          },
          {
            term: <DocCode>app/components/cupid-shell.tsx</DocCode>,
            def: "Edit. Wires the gameplay-event subscriber. Calls the resolver, mounts the popup, hands it the chosen quip.",
          },
          {
            term: <DocCode>public/assets/manager-quips/</DocCode>,
            def: "New folder. One audio file per quip id, hand generated through ElevenLabs (Lyan). Optional at ship time. Game does not crash when missing.",
          },
          {
            term: <DocCode>app/docs/product/voice.tsx</DocCode>,
            def: "Update to link out to the new product doc and include the manager fingerprint summary.",
          },
        ]}
      />
      <DocCallout variant="danger" title="The manager is not a gameplay actor">
        <P>
          She does not influence Date Health, member mood, or the Judge. She does not own any state
          a runtime AI provider could read. Treat her like a HUD notification with a voice.
        </P>
      </DocCallout>
    </>
  ),
};

const ARCHITECTURE_SECTION: DocSectionEntry = {
  id: "architecture",
  title: "Architecture",
  body: (
    <>
      <P>
        Three thin layers: a dispatcher on top of the existing shell, a resolver that picks the
        line, a popup that paints the standee and asks the SFX provider to play the file.
      </P>
      <DocList
        items={[
          <span key="events">
            <Strong>Event surface.</Strong> Extend the existing shell broker in{" "}
            <DocCode>app/components/cupid-shell.tsx</DocCode>. Do not introduce a new bus. The
            existing patterns for handleCommitPair, handleStartDate, and session-status effects
            (around lines 474, 490, and 340) are the right hook points.
          </span>,
          <span key="resolver">
            <Strong>Resolver.</Strong> Pure function in{" "}
            <DocCode>app/services/manager-quips.ts</DocCode>. Inputs: event kind, the in-memory log
            of fired ids and timestamps, the current shift index, optional event payload. Output:
            quip id or null. Variant picker rotates through quips that share a trigger key,
            preferring ones not heard yet in the session.
          </span>,
          <span key="state">
            <Strong>Ephemeral state.</Strong> A small in-memory log per session keyed by quip id and
            timestamp. Used for rate limiting and variant rotation. Does not persist to{" "}
            <DocCode>GameSave</DocCode> in v1. Cold launches reset it.
          </span>,
          <span key="audio">
            <Strong>Audio playback.</Strong> A new <DocCode>playVoiceClip(path: string)</DocCode>{" "}
            method on the SFX provider context. Loads the file through fetch and{" "}
            <DocCode>AudioContext.decodeAudioData</DocCode> (matching the existing date-ambient
            loop's pattern), caches the decoded buffer, plays through the shared master gain so mute
            and volume preferences apply. Resolves to a duration so the popup can auto-dismiss on
            the audio end.
          </span>,
          <span key="silent-fail">
            <Strong>Graceful fail.</Strong> Missing files (404), decode failures, or autoplay blocks
            do not throw. The popup still mounts and auto-dismisses on a fallback timeout (around
            four seconds). A single console warning per missing file is fine. No retries.
          </span>,
          <span key="silent-mode">
            <Strong>Silent mode.</Strong> Existing SFX volume / enable toggles already cover this.
            No new preference needed. When the user has SFX disabled, the visual still fires.
          </span>,
          <span key="tutorial">
            <Strong>Tutorial coexistence.</Strong> Suppress all quips while a required tutorial
            coach mark is on screen. Lazy support marks can coexist if the quip targets a different
            surface.
          </span>,
        ]}
      />
      <DocCallout variant="info" title="Autoplay restrictions">
        <P>
          In Tauri (desktop), audio plays freely. In web dev/preview, the first audio call after
          page load may be blocked until the user has clicked anything. The visual still fires
          regardless. Acceptable in v1.
        </P>
      </DocCallout>
    </>
  ),
};

const SCOPE_SECTION: DocSectionEntry = {
  id: "scope",
  title: "Scope",
  body: (
    <>
      <P>
        Keep this ship tight. The interesting work is the trigger taxonomy and the SFX wiring.
        Animation and copy authoring are well understood and should not balloon.
      </P>
      <DocDefList
        items={[
          {
            term: "In",
            def: "The standee popup, the SFX provider extension, the resolver, the rate limiter, the trigger wiring for all entries in the catalog, the relocation of the catalog from the preview file to fixtures, and tutorial coexistence.",
          },
          {
            term: "Out",
            def: "Runtime AI line generation. Per-member voice variants. Subtitles. Branching responses. Manager involvement during dates themselves. Localization. Audio recording is a separate content pass and can land after the wiring ships.",
          },
          {
            term: "Deferred",
            def: "Persisting the fired log into GameSave. Multiple manager characters. Player-triggered on-demand manager button. Per-trigger volume balancing.",
          },
        ]}
      />
    </>
  ),
};

const ACCEPTANCE_SECTION: DocSectionEntry = {
  id: "acceptance",
  title: "Acceptance",
  body: (
    <RoadmapAcceptance
      items={[
        "The catalog lives at app/fixtures/manager-quips.ts (moved from the preview component) and is imported by the popup, the product doc, and the resolver.",
        "The SFX provider exposes playVoiceClip(path) that plays through the same master gain, mute state, and volume preference as the named cues, and resolves silently when the file is missing.",
        "Triggers fire in the right places. Date.started fires after handleStartDate. Date.ended fires when activeSession transitions to completed or ended_early. Bad-fit, cool-down, encourage, and brittle fire from the wrap path. Retention warning, member quit, closure confirmed, over budget, soft win, and first focus swap each fire from their owning service path.",
        "Rate limiting holds: regular-lane quips fire at most once per shift, episodic at most once per surface per session, rare at most once per save.",
        "When an audio file is missing, the manager still pops up, the screen-reader line still reads, and the popup auto-dismisses after the fallback timer. No console errors.",
        "The standee mounts in the bottom of the viewport at character scale, top half visible, lower half clipped by the viewport. She does not overlap required tutorial coach marks.",
        "vp check, vp test, and vp build all pass.",
        "The product doc at /docs/product/manager-quips renders the full catalog with working preview controls. The voice doc links to it.",
      ]}
    />
  ),
};

const CHECKLIST_TASKS: RoadmapTaskItem[] = [
  {
    id: "fixtures",
    label: (
      <>
        Move the catalog out of the preview component into{" "}
        <RoadmapFileRef path="app/fixtures/manager-quips.ts" hint="new" />
      </>
    ),
    detail: (
      <P>
        Export <DocCode>MANAGER_QUIP_CATALOG</DocCode>,{" "}
        <DocCode>MANAGER_QUIP_TRIGGER_GROUPS</DocCode>, and the{" "}
        <DocCode>ManagerQuipTriggerKey</DocCode> type. Re-export from the preview component for
        backwards compatibility during the move, then drop the local definitions.
      </P>
    ),
  },
  {
    id: "sfx-extension",
    label: (
      <>
        Add <DocCode>playVoiceClip(path: string)</DocCode> to{" "}
        <RoadmapFileRef path="app/components/sfx-provider.tsx" hint="edit" />
      </>
    ),
    detail: (
      <P>
        Mirror the existing date-ambient loader: fetch the file, decode through{" "}
        <DocCode>AudioContext.decodeAudioData</DocCode>, cache the buffer per path, play through the
        shared master gain. Return a promise that resolves to the duration when successful and
        resolves silently (no rejection) on missing or blocked playback. Cover with a unit test in{" "}
        <RoadmapFileRef path="app/components/sfx-provider.test.ts" hint="new" /> that uses a stub
        fetch and asserts the silent-fail path.
      </P>
    ),
  },
  {
    id: "resolver",
    label: (
      <>
        Add the resolver and rate limiter at{" "}
        <RoadmapFileRef path="app/services/manager-quips.ts" hint="new" />
      </>
    ),
    detail: (
      <P>
        Pure function. Inputs: event kind, the in-memory fired log, the current shift index from the
        save. Output: a quip id or null. Picks among variants that share a trigger key, preferring
        ones not heard yet this session. Unit test the lane caps and variant rotation in{" "}
        <RoadmapFileRef path="app/services/manager-quips.test.ts" hint="new" />.
      </P>
    ),
  },
  {
    id: "popup-component",
    label: (
      <>
        Build the runtime popup at{" "}
        <RoadmapFileRef path="app/components/manager-quip-popup.tsx" hint="new" />
      </>
    ),
    detail: (
      <P>
        Reuse the visual recipe from{" "}
        <RoadmapFileRef path="app/components/manager-quip-preview.tsx" hint="edit" /> (the stage,
        the standee, the spring entrance, the bob). Switch the mount from an inline stage to a
        fixed-position portal under the shell. Call{" "}
        <DocCode>useSfx().playVoiceClip(quip.audio)</DocCode> on the entrance-settled tick. Auto
        dismiss on the audio-end resolve or after a 4.4 second fallback when audio is silent.
      </P>
    ),
  },
  {
    id: "shell-wiring",
    label: (
      <>
        Subscribe to gameplay events in{" "}
        <RoadmapFileRef path="app/components/cupid-shell.tsx" hint="edit" />
      </>
    ),
    detail: (
      <P>
        Hook the dispatcher into the existing shell handlers. Hand each event to the resolver and
        mount the popup when an id comes back. Suppress when a required tutorial step is active.
      </P>
    ),
  },
  {
    id: "trigger-date-started",
    label: <>Fire date.started after handleStartDate.</>,
    detail: (
      <P>
        After <DocCode>persist()</DocCode> succeeds in <DocCode>handleStartDate</DocCode> in the
        shell and before <DocCode>setActiveDateSessionId</DocCode>, dispatch a{" "}
        <DocCode>date.started</DocCode> event. The resolver picks one of the date-start variants in
        the catalog and rotates over the session.
      </P>
    ),
  },
  {
    id: "trigger-date-ended",
    label: <>Fire date.ended and date.ended-early on session status transitions.</>,
    detail: (
      <P>
        In the same effect that already watches <DocCode>activeSession?.status</DocCode> (around
        line 340 in the shell), dispatch <DocCode>date.ended</DocCode> on completed and{" "}
        <DocCode>date.ended-early</DocCode> on ended_early. Fire once per transition, not per
        re-render.
      </P>
    ),
  },
  {
    id: "trigger-outcomes",
    label: <>Fire outcome quips from the wrap path.</>,
    detail: (
      <P>
        Plumb bad-fit, cool-down, and encourage outcomes from the wrap finalizer in{" "}
        <RoadmapFileRef path="app/services/date-engine.ts" hint="edit" /> through the dispatcher. Do
        not couple the engine to the popup directly.
      </P>
    ),
  },
  {
    id: "trigger-pair",
    label: <>Fire pair trajectory and closure events.</>,
    detail: (
      <P>
        Trajectory-brittle from{" "}
        <RoadmapFileRef path="app/services/pair-trajectory.ts" hint="edit" /> and closure-confirmed
        from <RoadmapFileRef path="app/services/closures.ts" hint="edit" />.
      </P>
    ),
  },
  {
    id: "trigger-roster",
    label: <>Fire retention warning, member quit, first focus swap.</>,
    detail: (
      <P>
        Hook the retention-below-25 and quit transitions in{" "}
        <RoadmapFileRef path="app/domain/game.ts" hint="edit" /> derived state, plus the first
        focus-case swap penalty from{" "}
        <RoadmapFileRef path="app/services/focus-cases.ts" hint="edit" />.
      </P>
    ),
  },
  {
    id: "trigger-budget",
    label: <>Fire over-budget block at commit time.</>,
    detail: (
      <P>
        Block-state event from the booking flow in{" "}
        <RoadmapFileRef path="app/components/pre-date-canvas.tsx" hint="edit" /> when commit is
        attempted with the deck over budget.
      </P>
    ),
  },
  {
    id: "trigger-soft-win",
    label: <>Fire the soft-win quip on the five-closure cutscene.</>,
    detail: (
      <P>
        Once-per-save trigger keyed on the campaign closure counter crossing five. Suppress if the
        save already has the quip id in the fired log.
      </P>
    ),
  },
  {
    id: "tutorial-coexistence",
    label: <>Suppress quips while required tutorial steps are on screen.</>,
    detail: (
      <P>
        Read tutorial state from the save through the existing helper in{" "}
        <RoadmapFileRef path="app/services/tutorial.ts" hint="edit" /> and short-circuit the
        resolver when a required step is active.
      </P>
    ),
  },
  {
    id: "voice-doc",
    label: (
      <>
        Update the voice doc at <RoadmapFileRef path="app/docs/product/voice.tsx" hint="edit" />
      </>
    ),
    detail: (
      <P>
        Add a Manager fingerprint section and link to the product doc at{" "}
        <DocLink to="/docs/product/manager-quips">Manager check-in quips</DocLink>. Do not duplicate
        the catalog. Cross-link this plan during in-flight, then drop the link at closeout.
      </P>
    ),
  },
  {
    id: "audio-files",
    label: <>Generate the audio files through ElevenLabs (Lyan), as a separate content pass.</>,
    detail: (
      <P>
        Manual content task. Drop files under{" "}
        <RoadmapFileRef path="public/assets/manager-quips/" hint="new" /> with names that match the
        catalog ids. No dashes in scripts. Each line under six seconds. Flip{" "}
        <DocCode>status</DocCode> to <Strong>recorded</Strong> in the catalog as files land. The
        game still works while this is in progress.
      </P>
    ),
  },
  {
    id: "verify",
    label: <>Run the full verification sweep.</>,
    detail: (
      <P>
        <DocCode>vp check</DocCode>, <DocCode>vp test</DocCode>, <DocCode>vp build</DocCode>. Spot
        check each trigger in dev with Playwright at 1920x1080. Confirm graceful fail by deleting an
        audio file mid-session and watching the popup still fire silently.
      </P>
    ),
  },
];

const CHECKLIST_SECTION: DocSectionEntry = {
  id: "checklist",
  title: "Checklist",
  body: (
    <>
      <P>
        Build sequence: fixtures and resolver first, then the SFX extension, then the popup, then
        shell wiring, then the per-trigger plumbing. Audio recording is a parallel content track
        that can land after the wiring ships.
      </P>
      <RoadmapChecklist planSlug={PLAN_SLUG} tasks={CHECKLIST_TASKS} status={plan.status} />
    </>
  ),
};

const DECISIONS_SECTION: DocSectionEntry = {
  id: "decisions",
  title: "Decisions",
  body: (
    <RoadmapDecisionsLog
      entries={[
        {
          date: "2026-05-14",
          title: "Reactive quips first, voiced tutorial second",
          outcome: "accepted",
          body: (
            <P>
              Tutorial narration was the first instinct. We rejected it because tutorial copy is
              short, read once, and gets stale on replay. Reactive quips are bite sized, optional in
              feel, and let the manager carry character without owning instruction.
            </P>
          ),
        },
        {
          date: "2026-05-14",
          title: "Standee from the bottom, not a popsicle cutout",
          outcome: "accepted",
          body: (
            <P>
              An earlier draft proposed a paper cutout on a popsicle stick with a speech bubble in
              one of the bottom corners. Rejected. The standee approach reuses the existing
              standee-bottom portrait pattern from{" "}
              <DocCode>app/components/date-reactions.tsx</DocCode>, reads at character scale, and
              lets the audio carry the line without a redundant text card.
            </P>
          ),
        },
        {
          date: "2026-05-14",
          title: "Pre-generated ElevenLabs audio, not runtime TTS",
          outcome: "accepted",
          body: (
            <P>
              The manager's voice is fixed and hand-tuned. Pre-generation removes latency, lets the
              recording be audited line by line, and keeps the runtime free of an external audio
              dependency. The trade is that adding a line costs a manual recording pass.
            </P>
          ),
        },
        {
          date: "2026-05-14",
          title: "Audio is optional at ship time",
          outcome: "accepted",
          body: (
            <P>
              The visual ships first. Audio files land as a separate content pass. The popup must
              never crash on a missing file. Players see the standee, the screen-reader string
              reads, and the popup auto-dismisses on a fallback timer.
            </P>
          ),
        },
        {
          date: "2026-05-14",
          title: "Reject persisting the fired log in v1",
          outcome: "rejected",
          body: (
            <P>
              Persisting the fired log would let rare quips stay rare across reloads. We rejected it
              for the first ship because the in-memory log is enough during a single play session
              and avoids a save migration. Revisit if players report hearing the soft-win line more
              than once.
            </P>
          ),
        },
      ]}
    />
  ),
};

const VERIFICATION_SECTION: DocSectionEntry = {
  id: "verification",
  title: "Verification",
  body: (
    <>
      <P>
        Behavior, save-adjacent code, the SFX provider, and a new component all land in the same
        plan, so all three vp commands apply.
      </P>
      <DocCodeBlock language="powershell">{`vp check
vp test
vp build`}</DocCodeBlock>
      <DocList
        items={[
          "Smoke a fresh save in dev. Commit a pair and start the date, confirm the standee fires. Run through to the wrap, confirm the date-ended quip fires. Force a bad fit, confirm the outcome quip fires.",
          "Delete the audio file for one quip id mid-session. Trigger it. Confirm the standee still pops up and the screen-reader string still reads. No console errors.",
          "Mute SFX through Settings. Trigger any quip. Confirm the visual fires and audio stays silent.",
          "Force a required tutorial step on the dashboard, dispatch a quip event, confirm the popup is suppressed.",
          <span key="docs">
            Review the product doc at{" "}
            <DocLink to="/docs/product/manager-quips">Manager check-in quips</DocLink> and the
            updated voice doc at <DocLink to="/docs/product/voice">Voice</DocLink>.
          </span>,
        ]}
      />
    </>
  ),
};

export const sections: DocSectionEntry[] = [
  PREVIEW_SECTION,
  TRIGGER_SECTION,
  CONTRACT_SECTION,
  ARCHITECTURE_SECTION,
  SCOPE_SECTION,
  ACCEPTANCE_SECTION,
  CHECKLIST_SECTION,
  DECISIONS_SECTION,
  VERIFICATION_SECTION,
];

export default function ManagerQuipsPlanDoc() {
  return (
    <>
      <RoadmapPlanHeader slug={PLAN_SLUG} plan={plan} />
      <DocPage meta={meta} sections={sections} lede={lede} />
    </>
  );
}
