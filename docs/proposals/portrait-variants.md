# Proposal: Portrait variants driven by judge and stream events

## Summary

Add full-body portrait variants so dater standees can change expression during a date. Use streaming events for a transient typing or thought bubble, and use the latest judge snapshot for each member's persistent emotional pose. Support four standee moods per member: `neutral`, `flirty`, `confused`, `angry`.

Avatars stay neutral in v1. Variant work applies only to full-body portraits used on date surfaces.

Members do not need every variant to participate in the system. Any missing or pending mood portrait falls back to that member's neutral full-body portrait.

## Background

### What the judge already produces

The judge runs every two exchanges (every four character turns) and writes a `JudgeSnapshot` to the active session. Each snapshot carries:

- `dateHealthDelta`, applied to the running `dateHealth` (0 to 100)
- `statDeltas` over `chemistry`, `trust`, `stability`, `conflict`, `weirdnessTolerance`, `spark`, `strain`, `relationshipHealth` (folded into `pairState.stats`)
- `memberMoodDeltas` per member, allowing two daters in the same scene to feel different things
- `shouldEndEarly` and `earlyEndReason`
- `notableMoments[]` and `playerSummary` (display text)
- `memoryCandidates[]` (consumed by the summarizer at session end)

References: `judgeSnapshotSchema` in [app/domain/game.ts:365](app/domain/game.ts:365), `JUDGE_CHARACTER_TURN_INTERVAL = 4` in [app/services/ai-date-engine.server.ts:127](app/services/ai-date-engine.server.ts:127).

### What the schema already reserves

`memberPortraitsSchema` already names `neutral`, `flirty`, `confused`, `angry`, `embarrassed`, `furious` ([app/domain/game.ts:34](app/domain/game.ts:34)). The runtime `Portrait` component currently reads only `portraits.neutral` ([app/components/dashboard-atoms.tsx:96](app/components/dashboard-atoms.tsx:96)).

The schema should change before assets land. Today every mood value is a full `MemberPortraitSet`, which requires both `portrait` and `avatar`. For v1, `neutral` should keep the full set while non-neutral moods should be portrait-only:

```ts
type PortraitMood = "neutral" | "flirty" | "confused" | "angry";

type MemberPortraits = {
  neutral: MemberPortraitSet;
  flirty?: { portrait: PortraitAsset };
  confused?: { portrait: PortraitAsset };
  angry?: { portrait: PortraitAsset };
  embarrassed?: { portrait: PortraitAsset };
  furious?: { portrait: PortraitAsset };
};
```

This keeps avatar surfaces stable and avoids duplicating neutral avatar paths into every mood fixture.

### What the date engine already streams

The local AI engine emits `characterStart`, `characterDelta`, `characterDone`, and `judgeStart` events ([app/services/ai-date-engine.server.ts:80](app/services/ai-date-engine.server.ts:80)). The dashboard wires these into `streamingDrafts` ([app/components/cupid-operations-dashboard.tsx:525](app/components/cupid-operations-dashboard.tsx:525)). Per-message speaking state is already in the UI layer.

## Problem

We currently express date health visually with floating emoji bubbles built off the latest judge snapshot ([app/components/dashboard-views.tsx:2969](app/components/dashboard-views.tsx:2969)). Bubbles communicate direction, but the dater faces never change, so the cast reads as static. We want richer per-member expression without:

- adding an LLM-emitted facial expression field (brittle, costs tokens, weakens the judge's scoring focus)
- generating avatar variants that do not affect the date standees
- generating six or more pose variants per member up front
- requiring full variant coverage before any member can use the system
- tightening judge cadence to per-message (cost and latency)

## Proposal

### Two signal sources, two timescales

| Signal         | Source                                                            | Cadence             | Drives                           |
| -------------- | ----------------------------------------------------------------- | ------------------- | -------------------------------- |
| Speaking now   | stream events `characterStart`, `characterDelta`, `characterDone` | per message         | typing or thought bubble overlay |
| Emotional read | latest `JudgeSnapshot` and per-member `memberMoodDeltas`          | every two exchanges | full-body portrait variant       |

The judge stays the source of truth for which face. The UI derives the categorical variant from existing snapshot fields, the same way `buildReactionSignals` already mines them.

Streaming events drive a transient overlay, not a separate illustration. A character can be flirty while talking and angry while talking. Treating "speaking" as compositional with emotion keeps the art budget bounded.

### Variant menu

Four full-body portrait moods per member. All mood selection stays per member by using that member's `memberMoodDelta` as the gate for shared pair signals.

| Variant    | Trigger (per member)                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `neutral`  | no snapshot yet, missing member mood data, or all signals near zero                                                |
| `flirty`   | this member's `memberMoodDelta` is positive, and any of `spark`, `chemistry`, or `relationshipHealth` is positive  |
| `confused` | this member's `memberMoodDelta` is negative, and both `spark` and `trust` are flat or negative                     |
| `angry`    | this member's `memberMoodDelta` is negative, and `strain` or `conflict` is at least 4, or `shouldEndEarly` is true |

Priority order when multiple thresholds match: `angry` > `flirty` > `confused` > `neutral`.

This means one dater can turn angry while the other stays neutral, confused, or flirty. Shared pair trouble does not force both portraits into the same state unless both member mood deltas support it.

Members can ship with any subset of non-neutral variants. The requested mood should resolve through this order:

1. Requested mood portrait, if present and ready
2. Neutral full-body portrait
3. Existing initials fallback, only if no ready image exists

This lets assets roll in over time. A member with only `neutral` behaves exactly like today's implementation.

Skip `embarrassed` and `furious` for v1. They are edge states and add more asset work with lower gameplay payoff. Add later if playtest demands them.

We do not introduce `happy`, `disinterested`, or `chatting` as portrait variants:

- `happy` collapses into `flirty` for this romantic context
- `disinterested` collapses into `confused` (checked out, low spark)
- `chatting` is per-message UI ephemera, not a pose

### Derive helpers

Add pure helpers beside the current reaction signal derivation, or extract both into a small date presentation signal module if testability needs it:

```ts
type PortraitMood = "neutral" | "flirty" | "confused" | "angry";

function selectPortraitMood(memberId: string, snapshot: JudgeSnapshot | undefined): PortraitMood;

function isMemberSpeaking(
  memberId: string,
  streamingDrafts: readonly StreamingDraftMessage[],
): boolean;
```

`isMemberSpeaking` should return true only for drafts with `status === "streaming"`. Drafts marked `"done"` should not keep the overlay alive.

### Speaking and thought bubble

The speaking overlay should read like a compact messaging-app bubble anchored near the active standee:

- rounded speech bubble shape, frosted Aura surface, subtle tail toward the speaker
- animated three-dot typing indicator while character text streams and no reasoning display stream is available
- provider reasoning text if the selected model and provider stream reasoning deltas during the same character generation request
- no impact on transcript, state, judge scoring, or member mood selection

Do not add a separate inner-monologue model call for this feature. The bubble should consume only the active character generation stream. If that stream contains no reasoning text, the UI falls back to dots.

Provider reasoning text remains temporary UI only:

- not saved to the transcript unless a later feature explicitly introduces thought records
- not used as gameplay evidence by the judge or deterministic services
- cleared when the character message finishes

This needs a stream event type such as `characterReasoningDelta` if the AI SDK and selected provider expose reasoning deltas. The pre-variant stream contract only exposed character text deltas, character done, judge start, complete, and error.

### Component changes

- `Portrait` accepts a `mood` prop but applies it only when `asset === "portrait"`. Avatar requests always use `member.portraits.neutral.avatar`.
- `Portrait` reads `member.portraits[mood]?.portrait ?? member.portraits.neutral.portrait` and also falls back to neutral when the mood portrait exists but is still `model: "pending"`.
- `DaterStandee` accepts `mood` and `speaking`; it mounts the typing bubble when `speaking` is true.
- `DateView` derives both values per side from `session.judgeSnapshots.at(-1)` and `streamingDrafts`.
- Preload available mood portrait paths for the two active participants when the date surface mounts, so the first mood swap does not flash initials.

The first implementation affects the `xl` standee frame only, because date standees are currently hidden below `xl`. Avatar and compact member surfaces remain unchanged.

## Trade-offs and alternatives considered

### Drive variants from per-message LLM facial output

Rejected. Forces the performer to commit to a categorical pose every turn, costs tokens, and the performer's emotional self-reports are noisier than the judge's exchange-level read. It also dilutes the architectural rule that the judge owns gameplay scoring.

### Make "speaking" a fifth illustration

Rejected for v1. Every emotion would need its own speaking pose, and speech would no longer stack cleanly with emotion. Overlay is composable.

### Add a separate inner-thought model call

Rejected. The bubble should show reasoning only when it comes from the active character generation stream. A separate call would add cost, latency, and another prompt surface without improving gameplay authority.

### Tighten judge cadence to every exchange

Rejected. Doubles judge cost; judge latency is already the slowest beat in the loop. If exchange-pair cadence feels too slow in playtest, peek at the current speaker's last message and `dateHealth` slope as an interim refinement before touching cadence.

### Add `disinterested`, `concerned`, `happy` to schema

Rejected. They overlap with existing schema entries and add per-member generation cost without distinct gameplay meaning.

### Require full-roster variant coverage before shipping

Rejected. The fallback path lets code ship first, then assets can roll in by member as each portrait is approved.

## Implementation sketch

1. Adjust `memberPortraitsSchema` so `neutral` remains a full portrait set and non-neutral moods are portrait-only.
2. Extend `Portrait` and `DaterStandee` to accept `mood` and `speaking`. Default both to current behavior so the change ships before assets do.
3. Add `selectPortraitMood`, `isMemberSpeaking`, and the portrait asset resolver. Cover priority, per-member gating, missing mood data, partial variant coverage, pending asset fallback, and `streaming` only speaking state with tests.
4. Wire the dashboard to pass derived `mood` and `speaking` into both standees.
5. After this plan is approved, update `docs/world/image-style.md` with variant naming, source and cutout paths, prompt rules, and acceptance checks.
6. Build the bubble with animated dots by default, and add same-request reasoning text only if the selected provider exposes it through the stream.
7. Generate `flirty`, `confused`, and `angry` full-body portraits as they are approved. Run `vp run portrait:cutout` only after source images are approved.
8. Approve and check in cutouts. Variants come online for any member that has them; everyone else falls back to `neutral`.

Verification:

- `vp check` after code changes
- `vp test` once derive logic and component changes land
- `vp build` because this touches user-facing date workflow
- Playwright pass against the running dev server to confirm portraits swap with judge snapshots, missing variants fall back to neutral, and the typing bubble tracks streaming

## Open questions

- Speaking overlay style: use a compact bubble. Show dots by default. Show reasoning text only when the active provider stream supplies it.
- Asset semantics: `angry` should mean the character's negative boundary state, interpreted through personality. It can range from distressed, concerned, guarded, irritated, cold, disinterested, or visibly angry. Avoid requiring every member to perform the same face.
- Snapshot basis: single latest snapshot is enough for v1. If playtest finds flicker or stale reads, consider a tiny snapshot history or aggregate member mood across the active date.
- Reasoning stream availability: the AI SDK can expose reasoning deltas through `fullStream`, but provider support is model-dependent.

## Out of scope

- No changes to the judge prompt or `judgeSnapshotSchema`.
- No changes to scenario fixtures.
- No changes to avatar variants in v1.
- No separate inner-thought model call. Provider reasoning deltas from the active character generation stream are allowed if the provider exposes them.
- No changes to the memory pipeline.
