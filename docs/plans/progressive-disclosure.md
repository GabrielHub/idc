# Progressive Disclosure Implementation Plan

Status: actionable draft
Date: 2026-05-09

## Purpose

Refactor member and match guidance so the player starts with incomplete case files, then earns useful reads through dates. Cupid should still give enough information to book a responsible date, but the current UI gives too much of the answer key before play begins.

This plan is written for an implementation agent to execute end to end.

## Locked Product Decisions

- Dating profiles are partially obscured at the start. The implementation can choose the best Aura-compatible treatment, such as redacted lines, blurred text, blanks, or question marks. It must read as information that can be revealed later.
- Reveals expose player-facing reads, not internal metadata. Never show hidden tag names, rule hit ids, raw fixture indexes, model prompts, or scoring internals to the player.
- Reveal granularity uses filed reads, not exact internal facts. Example: reveal `Opal resists destiny pressure`, not the matching hidden tag, and not necessarily the exact authored dealbreaker line.
- The Judge participates in reveal timing, but the Judge does not own truth. Game services validate and persist accepted reveals.
- The final plan must preserve the existing architecture: app-owned state is authoritative, services own gameplay consequences, repositories only persist, UI only presents typed state and intents.
- Exact pair stats are not player-facing in this pass. Do not add a `pair_stats` read kind. `pair_dynamic` carries player-facing pair knowledge while Spark, Strain, and Relationship Health stay internal service state.
- Exact Date Health remains visible during the live date because it is the fail state players must manage. Reports and public notes must not repeat exact Date Health.
- Persisted Judge snapshots store validated reveal evidence ids so UI can attach reads to Judge notes and reloads can audit why knowledge was filed.

## Correct Reveal Rule

Use a bounded candidate system.

A fact is revealed only when all of these are true:

1. A game service created a reveal candidate from authoritative data for the active date context.
2. The candidate id is display-safe. It cannot contain hidden tag names, raw rule hit strings, fixture array indexes, or prompt-only labels.
3. The Judge selected that candidate as evidence used in the exchange, or a deterministic hard stop selected it.
4. The service validates the selected id against the current candidate packet.
5. The service persists a player knowledge record containing only display-safe read text and source references.

This is the best interpretation of "used in judgement" because it gives the Judge room to say what mattered without letting an LLM invent a trait or accidentally publish internal metadata.

The Judge should act like a classifier over bounded evidence candidates. It should not write free-form new knowledge.

## Current Disclosure Audit

### Roster And Dossier

Files:

- `app/components/dashboard-views.tsx`

Current leaks:

- Featured case cards show exact Mood, Openness, Burnout, and quit risk.
- Partner tiles show dating profile teaser plus exact Mood, Openness, Burnout, and quit risk.
- Partner search indexes species, origin, reality status, bio, full dating profile, relationship needs, preferences, and dealbreakers.
- Filters expose human versus non-human, mood, openness, and picked state.
- Sort exposes exact mood and openness ordering.
- Dossiers show the full dating profile, exact member state meters, current ask, relationship needs, preferences, dealbreakers, and quit risk.

Target:

- Starting roster shows portrait, name, partial profile, current ask for featured cases, and sealed file hints.
- Hidden fields cannot be searched, filtered, sorted, or displayed until revealed.
- Dossier becomes the main place to collect filed reads over time.

### Brief

Files:

- `app/components/cupid-operations-dashboard.tsx`
- `app/components/dashboard-views.tsx`
- `app/services/match-fit.ts`

Current leaks:

- `buildPairPreview` evaluates match fit before the date starts.
- `BriefDock` shows Fit, Pressure, and Ask labels before any exchange.
- `buildPublicRiskNotes` names the exact member and boundary risk before the date starts.
- `PairStage` shows exact Spark, Strain, and Health for known pair states.
- Scenario cards show title, risk, public location, premise, and scenario tags.
- Scenario fixture fields `idealFor` and `badFor` exist but are not currently displayed.

Target:

- Do not show pre-date Fit, Pressure, Ask, named risk notes, or exact pair stats.
- Keep scenario title, public location, premise, broad risk, deck powers, and company goals.
- Keep prior public notes and previously revealed pair reads.

### Scene Draft

Files:

- `app/components/dashboard-views.tsx`
- `app/fixtures/scenarios/*`

Current exposure:

- The player chooses three scene events from six.
- Scene cards show event title and event text.
- During the date, chosen scene titles can be dropped from the footer.

Target:

- Keep this mostly visible. Scene choice is player agency.
- Do not pre-label which member read a scene will trigger.

### Date View

Files:

- `app/components/dashboard-views.tsx`
- `app/components/date-presentation-signals.ts`

Current exposure:

- Transcript includes Judge notes from `snapshot.playerSummary`.
- Portrait mood and reaction icons derive from judge deltas.
- Footer shows exact Date Health, turn count, Judge pass count, nudge slots, and scene slots.
- Nudge suggestions derive from latest judge deltas and can imply how to fix the date.

Target:

- Judge notes become the primary reveal moment.
- New reveals get a small filed read treatment in the transcript or near the Judge note.
- Date Health remains exact because it is the live fail state.
- Nudge suggestions stay generic unless they reference already revealed reads.

### Final Report

Files:

- `app/components/dashboard-views.tsx`
- `app/services/date-engine.ts`
- `app/services/ai-date-engine.ts`

Current leaks:

- Final reports show exact stat summaries.
- Follow-up action copy lists projected stat effects.

Target:

- Final report lists reads revealed this date.
- Hard stops confirm the relevant player-facing boundary read.
- Follow-up projections become intent copy, not stat math.

### Notes

Files:

- `app/components/dashboard-views.tsx`
- `app/services/date-engine.ts`
- `app/services/ai-date-engine.ts`
- `app/services/date-prompts.ts`

Current leaks:

- Public note cards show memory tags.
- Deterministic fallback memory can include exact Date Health.

Target:

- Notes archive earned public knowledge.
- Hide raw memory tags unless they pass through a display-safe allowlist mapper.
- Public memory text should not include exact Date Health or internal stat language.

### Prompts And Services

Files:

- `app/services/date-prompts.ts`
- `app/services/match-fit.ts`
- `app/services/date-engine.ts`
- `app/services/ai-date-engine.ts`

Current behavior:

- Character prompts receive full member needs, preferences, dealbreakers, secrets, state, and pair friction subtext.
- Judge prompts receive scenario rubric, Date Health, pair stats, and prior judge filings.
- `evaluateMatchFit` computes internal rule hits, hard stops, blocked requests, covered requests, and public fit signals.
- `pairRuleHits` feeds hidden pair friction to performers, not the UI.

Target:

- Keep runtime AI context strong.
- Only change player visibility.
- Add a reveal candidate packet to Judge prompts.
- Validate Judge-selected candidate ids before persistence.

## Visibility Contracts

### Member Fields

Starting public member fields:

- `name`, `firstName`, portrait assets, and retained or closed-file state.
- The featured member's current request text, because it is the work order for the shift.
- Profile fragments produced by `buildVisibleMemberProfile`. These are authored display fragments, not hidden DOM text.

Gated member fields:

- `species`, `origin`, `dimension`, `realityStatus`, and `bio`.
- Full `datingProfile`.
- `relationshipNeeds`, `preferences`, and `dealbreakers`.
- Exact Mood, Openness, Burnout, and quit risk.

Never player-facing:

- `secrets`, `tags`, `voice`, exact `retention`, prompts, raw rule hits, fixture indexes, and scoring deltas.

Search, filters, sort modes, tooltips, aria labels, and hidden DOM text must follow the same boundary. If a field is gated, it cannot be searched, sorted, filtered, or embedded invisibly until a matching player knowledge read exists.

### Pair Stats

Do not add a `pair_stats` or numeric stat disclosure read kind in this pass. `PairStage`, `BriefDock`, final reports, notes, and follow-up copy must not render Spark, Strain, Relationship Health, or raw relationship stat numbers to the player. Services keep `pairState.stats` authoritative for scoring and consequences.

Pair visibility comes from:

- Prior public notes.
- `pair_dynamic` reads.
- Outcome labels and follow-up intent copy without stat math.

### Date Final Report Fields

Keep `dateFinalReportSchema.summary` and `dateFinalReportSchema.statSummary` required for save stability during this implementation.

Field contracts:

- `summary` is the player-facing outcome narrative for the date. It may name the pair, scenario, and outcome, but it must not include exact stat names, stat values, stat deltas, or exact Date Health.
- `statSummary` is retained as the existing schema field name, but its content becomes a player-safe filing note. Treat it as "case summary" copy in UI until a later migration can rename it. It must not include Spark, Strain, Health, raw deltas, exact Date Health, or projected stat effects.

Task 9 must update deterministic `completeDate` copy, AI final report fallback copy, and `FinalReportPanel` copy tests around this contract instead of dropping the field.

### Judge Snapshot Evidence

Add `usedEvidenceIds: z.array(z.string().min(1)).default([]).max(3)` to `judgeSnapshotSchema` as persisted snapshot data.

Persist only validated ids:

- The AI output schema may parse proposed ids.
- The date engine validates those ids against the current reveal candidate packet.
- Unknown ids are dropped before the snapshot is stored.
- The stored `usedEvidenceIds` list is the accepted evidence set used to file player knowledge and attach reveal UI to the matching Judge note.

## Player Knowledge Data Model

Add save-owned player knowledge. Do not store it inside `Member`, because `hydrateFixtureOwnedMemberData` refreshes fixture-owned member data and only preserves `member.state`.

Add schemas in `app/domain/game.ts`:

```ts
const playerKnowledgeSubjectKindSchema = z.enum(["member", "pair", "scenario"]);
const playerKnowledgeReadKindSchema = z.enum([
  "profile",
  "comfort",
  "boundary",
  "ask",
  "pair_dynamic",
  "scenario_pressure",
]);
const playerKnowledgeConfidenceSchema = z.enum(["filed", "confirmed"]);
const playerKnowledgeSourceSchema = z.enum(["judge", "hard_stop", "final_report"]);

const playerKnowledgeRecordSchema = z.object({
  id: z.string().min(1),
  subjectKind: playerKnowledgeSubjectKindSchema,
  subjectId: z.string().min(1),
  readKind: playerKnowledgeReadKindSchema,
  readId: z.string().min(1),
  readText: z.string().min(1),
  confidence: playerKnowledgeConfidenceSchema,
  source: playerKnowledgeSourceSchema,
  dateSessionId: dateSessionIdSchema.optional(),
  judgeSnapshotId: z.string().min(1).optional(),
  evidenceText: z.string().min(1).optional(),
  revealedAt: z.string().min(1),
});
```

Add `playerKnowledge: z.array(playerKnowledgeRecordSchema).default([])` to `gameSaveSchema`.

Important:

- `readId` must be display-safe. Use values like `member:opal-sunday:boundary:destiny-pressure`, not raw hidden tag names, rule hit ids, or fixture paths.
- Do not persist hidden tags, internal rule hits, prompt text, fixture indexes, or raw scoring deltas in `playerKnowledge`.
- Services can recompute internal support from fixtures and match fit when needed.
- There is intentionally no numeric pair stat read kind. A future implementation can add a separate migration if exact pair meters ever become player-facing again.

## Reveal Candidate Model

Create a new service file:

- `app/services/player-knowledge.ts`

Internal type:

```ts
type RevealCandidate = {
  id: string;
  subjectKind: "member" | "pair" | "scenario";
  subjectId: string;
  readKind: PlayerKnowledgeReadKind;
  readText: string;
  evidenceText: string;
  source: "judge" | "hard_stop";
};
```

This type is safe to send to the Judge because it contains only display-safe reads.

Candidate builders may use internal data while building candidates, but internal signals stay inside local function scope.

Confidence is not part of `RevealCandidate`. Confidence is assigned by `upsertPlayerKnowledge`:

- New Judge-selected reads are `filed`.
- Hard-stop reads are `confirmed`.
- A repeated Judge selection of an existing `readId` upgrades `filed` to `confirmed`.
- Final report confirmation can upgrade reads revealed during that date to `confirmed`, especially hard-stop reads.

Candidate examples:

- Member boundary: `Opal resists destiny pressure.`
- Member comfort: `Mei relaxes when the date gives her a concrete craft to discuss.`
- Ask: `Jenna's current ask needs a normal room before it can work.`
- Pair dynamic: `Sincerity and performance are pulling against each other.`
- Scenario pressure: `This room turns public attention into the main hazard.`

## Reveal Candidate Sources

Generate the full local candidate set from these authoritative sources:

- Active focus request.
- Scenario public facts and pressure shape.
- `evaluateMatchFit` result.
- Hard stop result.
- Blocked and covered request ids.
- Pair rule hits.
- Member authored fields, only as support for display-safe read text.

Do not generate candidates directly from:

- Free-form Judge summaries.
- Free-form performer output.
- Memory tags.
- Raw hidden member tags as display text.

Only pass exchange-eligible candidates to the Judge. Do not send every plausible pre-date candidate. Eligibility must be derived from the current exchange context:

- The active hard stop.
- A scenario event triggered since the previous Judge snapshot.
- Current exchange messages that visibly reference the candidate's evidence condition.
- The focused request when the latest exchange or applied match-fit consequence made that request matter.
- Pair rule hits whose deterministic drift affected this Judge snapshot.

Cap the prompt packet to the highest priority eligible candidates, with hard stops first, then blocked asks, then strong positive or negative pair dynamics, then scenario pressure, then comfort reads. The Judge may still return no ids.

## Reveal Application Flow

### AI Date Engine

Files:

- `app/services/ai-date-engine.ts`
- `app/services/date-prompts.ts`
- `app/services/ai/model-service.ts`

Flow:

1. Before calling the Judge, build `matchFit`.
2. Build and filter reveal candidates for `{ session, members, scenario, pairState, focusRequest, matchFit, exchangeMessages, latestTriggeredEvent }`.
3. Pass only exchange-eligible candidates into `buildJudgePromptPacket`.
4. Extend the AI judge schema with `usedEvidenceIds: z.array(z.string().min(1)).default([]).max(3)`.
5. After the Judge returns, validate `usedEvidenceIds` against the current candidate packet.
6. Persist the Judge snapshot with only accepted `usedEvidenceIds`.
7. Call `applyJudgeReveals` with the accepted ids.
8. `applyJudgeReveals` persists only valid display-safe knowledge records.

### Deterministic Date Engine

Files:

- `app/services/date-engine.ts`

Flow:

1. Build reveal candidates at the same point match fit is applied to a Judge snapshot.
2. If a hard stop exists, reveal the related boundary and scenario pressure candidates.
3. If no hard stop exists, call `selectDeterministicRevealIds`.
4. `selectDeterministicRevealIds` selects at most one id per Judge pass, or at most two when `Math.abs(dateHealthDelta) >= 6`.
5. Non-hard-stop deterministic reveals require a meaningful applied consequence: `Math.abs(dateHealthDelta) >= 3`, any stat delta magnitude at least 3, or any member mood delta magnitude at least 3.
6. Select the candidate that explains the largest applied consequence in this priority order: blocked ask, covered ask, pair dynamic, scenario pressure, comfort.
7. Persist the Judge snapshot with accepted `usedEvidenceIds`.
8. Persist player knowledge via the same `applyJudgeReveals` helper.

This is engine behavior, not test behavior. Deterministic tests should assert this selection rule directly.

### Hard Stops

Hard stops should reveal immediately because the system already used the boundary as decisive gameplay evidence.

Examples:

- Prophecy room plus destiny boundary reveals a display read about destiny pressure.
- Museum public exposure plus privacy boundary reveals a display read about public attention.
- Memory-course pressure plus grief boundary reveals a display read about forced recovery pressure.

The displayed read should never name raw values from `memberTagSchema`.

## Judge Prompt Contract

Update `buildJudgePromptPacket` to include:

```text
Reveal candidates:
Use these ids only if the exchange made that evidence matter.
Return at most 3 usedEvidenceIds.
Do not invent ids.
Do not reveal hidden tags, rule names, or private implementation labels.
It is valid to return an empty usedEvidenceIds array.
Do not select a candidate just because it is true in the fixtures.
```

Candidate list shape in prompt:

```text
- id: member:opal-sunday:boundary:destiny-pressure
  read: Opal resists destiny pressure.
  evidence: The room or exchange applied fate, prophecy, or chosen-one framing to Opal.
```

The Judge output can say:

```json
{
  "usedEvidenceIds": ["member:opal-sunday:boundary:destiny-pressure"]
}
```

When the exchange does not make a candidate matter, the Judge output should say:

```json
{
  "usedEvidenceIds": []
}
```

The service still validates this id against the current candidates. Unknown ids are ignored and never persisted.

## UI Requirements

### Redacted Dating Profile

Add a selector such as `buildVisibleMemberProfile(member, playerKnowledge)` that returns:

```ts
type VisibleMemberProfile = {
  publicFragments: string[];
  redactedBlocks: Array<{
    id: string;
    label: string;
    lineCount: number;
  }>;
  revealedReads: PlayerKnowledgeRecord[];
};
```

`redactedBlocks.length` is the redacted fragment count. Consumers should render the blocks, not infer a separate shape.

Initial profile display can be implemented as redacted lines, blur, blanks, or question marks. Requirements:

- It must be clear that hidden text can be revealed later.
- It must preserve Aura visual language.
- It must use Tailwind utilities through `className`.
- It must not use inline styles.
- It must not make hidden text available through search, title attributes, aria labels, or hidden DOM text.

### Roster

Update `RosterView`, `FeaturedCaseCard`, `PartnerTile`, `DossierFilterRail`, and `MemberDossier`.

Requirements:

- Search only public fields and revealed reads.
- Do not search `species`, `origin`, `dimension`, `realityStatus`, `bio`, full `datingProfile`, `relationshipNeeds`, `preferences`, or `dealbreakers` until matching reads exist.
- Remove mood and openness filters until those reads are intentionally filed.
- Remove mood and openness sorts until those reads are intentionally filed.
- Replace exact Mood, Openness, Burnout with sealed file state or qualitative revealed state.
- Current featured ask can stay visible because it is the work order for the shift.
- Quit state can show only closed file. Risk should be qualitative and gated.

### Brief

Update `buildPairPreview`, `BriefDock`, and `PairStage`.

Requirements:

- Do not show pre-date `Fit`, `Pressure`, or `Ask` for unrevealed pair context.
- Do not show `buildPublicRiskNotes` output before the date.
- Show prior revealed pair reads and public notes when present.
- Keep scenario title, location, premise, broad risk, deck powers, and goals.
- Remove raw scenario tag chips from the initial brief. Do not render `scenario.card.tags` directly.
- After a `scenario_pressure` read exists, show display-safe pressure labels derived from the read text, not from raw enum values.
- `PairStage` must not render Spark, Strain, Relationship Health, or numeric relationship meters. Show known pair reads and nonnumeric outcome copy instead.

### Date

Update `buildTranscriptItems`, `JudgeNote`, or nearby date view components.

Requirements:

- Judge notes can show newly filed reads from the accepted reveal records.
- Reveals should appear near the Judge note that created them.
- Nudge suggestions must not reference unrevealed reads.
- Date Health remains exact in the live date UI.

### Final Report

Update `FinalReportPanel`.

Requirements:

- Show reads revealed during the date.
- Replace exact follow-up projections with intent copy.
- Do not show raw stat deltas.
- Do not render Spark, Strain, Health, raw stat values, raw stat deltas, or exact Date Health in `summary` or `statSummary`.
- Confirm hard stop reads if the date ended early from a boundary.

### Notes

Update `NotesView`, `FeaturedNoteCard`, and `NoteCard`.

Requirements:

- Hide raw memory tags from player cards unless they pass through a display-safe allowlist mapper.
- Public memory text must not include exact Date Health.
- Notes should help the player reuse earned knowledge without exposing internal scoring.

Unsafe tag sources are `judgeSnapshot.memoryCandidates`, AI summarizer memory candidates, and system-added indexing tags such as scenario ids. Deterministic tags like `date` and risk labels are already display-safe, but they still go through the same mapper so raw snake_case and scenario ids never leak by accident.

## Implementation Tasks

### Task 1: Domain And Save Seed

Files:

- `app/domain/game.ts`
- `app/services/game-seed.ts`
- `app/repositories/local-game-repository.ts`

Changes:

- Add player knowledge schemas and types.
- Add `usedEvidenceIds: z.array(z.string().min(1)).default([]).max(3)` to `judgeSnapshotSchema`.
- Add `playerKnowledge` to `gameSaveSchema`.
- Bump `SAVE_SCHEMA_VERSION`.
- Seed `playerKnowledge: []`.
- Preserve `playerKnowledge` through fixture hydration.
- Keep alpha save behavior consistent with the current version bump approach.

Tests:

- New seed save has empty player knowledge.
- Parsed save accepts player knowledge.
- Parsed Judge snapshots default `usedEvidenceIds` to an empty array.
- Fixture hydration preserves player knowledge.

### Task 2: Knowledge Selectors

Files:

- `app/services/player-knowledge.ts`

Add:

- `visibleReadsForMember(save, memberId)`.
- `visibleReadsForPair(save, pairId)`.
- `visibleReadsForScenario(save, scenarioId)`.
- `buildVisibleMemberProfile(member, knowledge)`.
- `isReadKnown(save, readId)`.
- `upsertPlayerKnowledge(save, records)`.

Tests:

- Selectors return no hidden facts on a new save.
- Selectors return only matching subject reads.
- Upsert deduplicates by read id and upgrades `filed` to `confirmed`.
- `buildVisibleMemberProfile` always returns `publicFragments`, `redactedBlocks`, and `revealedReads`.

### Task 3: Reveal Candidates

Files:

- `app/services/player-knowledge.ts`
- `app/services/match-fit.ts`

Add:

- `buildRevealCandidates(input)`.
- `filterExchangeEligibleRevealCandidates(input)`.
- Candidate builders for member boundary, member comfort, ask, pair dynamic, and scenario pressure.
- Display-safe read id helpers.
- `selectDeterministicRevealIds(input)`.

Tests:

- Candidate ids do not contain hidden tag names or raw rule hit strings.
- Hard stop contexts produce boundary candidates.
- Blocked asks produce ask candidates.
- Pair rule hits produce pair dynamic candidates.
- Pre-date applicable candidates are not sent to the Judge unless the current exchange makes them eligible.
- Deterministic non-hard-stop reveals follow the largest applied consequence priority rule.

### Task 4: Judge Contract

Files:

- `app/services/date-prompts.ts`
- `app/services/ai/model-service.ts`
- `app/services/date-prompts.test.ts`

Changes:

- Add reveal candidates to Judge prompt input.
- Extend structured Judge output with `usedEvidenceIds`.
- Ensure persisted Judge snapshots carry only validated `usedEvidenceIds`.
- Cap returned ids at 3.
- Keep output validation strict.
- Add refusal instructions and examples for returning an empty `usedEvidenceIds` array.

Tests:

- Judge prompt includes candidate ids and display reads.
- Judge prompt does not contain hidden tag names or raw rule hit strings.
- Structured output accepts known ids.
- Unknown ids are still parsed but later dropped by service validation.
- Persisted snapshots do not retain unknown ids.

### Task 5: Reveal Persistence In Date Engines

Files:

- `app/services/date-engine.ts`
- `app/services/ai-date-engine.ts`
- `app/services/player-knowledge.ts`
- `app/services/ai-date-engine.test.ts`
- relevant deterministic service tests

Changes:

- Build candidates before every Judge pass.
- Apply accepted reveals after match fit has been applied to the Judge snapshot.
- Persist new knowledge records in the returned save.
- Persist accepted reveal ids in `judgeSnapshot.usedEvidenceIds`.
- Do not persist raw AI proposed ids that failed validation.

Tests:

- Hard stop reveals the relevant display-safe boundary.
- Judge-selected valid id persists.
- Judge-selected invalid id is ignored.
- Judge-selected invalid id is not stored in the snapshot.
- No reveal persists without a Judge pass or hard stop.
- Reveals survive complete date flow.

### Task 6: Roster And Dossier Masking

Files:

- `app/components/dashboard-views.tsx`
- `app/components/dashboard-views.test.ts`
- possible new presentation helper tests

Changes:

- Pass player knowledge into roster and dossier components.
- Use visible profile selector.
- Remove hidden search inputs from roster search.
- Remove or gate filters and sorts that depend on hidden fields.
- Replace full species, origin, reality status, bio, needs, preferences, and dealbreakers with filed reads.

Tests:

- New save dossier does not render hidden need, preference, or dealbreaker text.
- New save dossier does not render hidden species, origin, reality status, or bio text.
- New save search cannot find hidden fact text.
- Revealed read appears in dossier.
- Redacted profile does not expose hidden text in DOM text content.

### Task 7: Brief Masking

Files:

- `app/components/cupid-operations-dashboard.tsx`
- `app/components/dashboard-views.tsx`

Changes:

- Stop passing pre-date fit signal and risk notes for unrevealed context.
- Replace dock guidance with forecast pending copy.
- Show known pair reads when present.
- Keep deck powers and scenario selection intact.
- Remove raw scenario tag chips from the initial brief.
- Remove numeric pair stat meters from `PairStage`.

Tests:

- Brief does not render `Fit`, `Pressure`, `Ask`, blocked ask copy, or named risk notes on a new pair.
- Brief renders a previously revealed pair read.
- Brief does not render raw scenario tag chips.
- `PairStage` does not render Spark, Strain, Health, or numeric pair meters.

### Task 8: Date Reveal Presentation

Files:

- `app/components/dashboard-views.tsx`
- `app/components/date-presentation-signals.ts` if needed

Changes:

- Show accepted reveals near the Judge note that created them.
- Keep exact Date Health in the live date UI.
- Gate nudge suggestions against known reads.

Tests:

- Judge note can show a new filed read.
- Nudge suggestions do not mention unrevealed reads.

### Task 9: Final Report And Notes Cleanup

Files:

- `app/components/dashboard-views.tsx`
- `app/services/date-engine.ts`
- `app/services/ai-date-engine.ts`
- `app/services/date-prompts.ts`

Changes:

- Final report shows reads revealed during the date.
- Keep `statSummary` required, but rewrite it as player-safe case summary copy.
- Keep `summary` player-safe and nonnumeric.
- Follow-up copy stops listing stat projections.
- Deterministic fallback memory text stops writing exact Date Health.
- Note cards hide raw tags unless they pass through the display-safe allowlist mapper.

Tests:

- Final report shows new reads.
- Follow-up copy does not include raw stat projection language.
- Final report `summary` and `statSummary` do not include Spark, Strain, Health, raw stat values, raw stat deltas, or exact Date Health.
- Public notes do not include exact Date Health.
- Note cards do not render raw internal tags, raw snake_case, or scenario ids.

### Task 10: Docs And Verification

Files:

- `docs/world/gameplay-traits.md`
- `README.md` if command or architecture notes need updates

Changes:

- Update `species`, `origin`, `dimension`, `realityStatus`, `bio`, `datingProfile`, `relationshipNeeds`, `preferences`, and `dealbreakers` docs from "visible fields" to "authored facts that may become visible through player knowledge."
- Keep hidden tags documented as internal deterministic inputs.
- Add note that player knowledge is save-owned and service-validated.

Verification:

- `vp check`
- `vp test`
- `vp build`
- Playwright smoke pass on roster, dossier, brief, date, final report, and notes. The dev server must already be running before Playwright work starts.

## Acceptance Criteria

- A new player cannot read the full dating profile, relationship needs, preferences, or dealbreakers before earning reveals.
- A new player cannot read gated species, origin, dimension, reality status, or bio before earning reveals.
- Hidden facts are not present in searchable DOM text, title attributes, aria labels, roster search indexes, filters, or sort modes.
- Pre-date brief no longer tells the player exact fit, pressure, blocked ask, or named member boundary risks for unrevealed context.
- Pre-date brief does not render raw scenario tags or exact pair stat meters.
- Judge reveals are selected from bounded candidates.
- Judge snapshots persist only validated `usedEvidenceIds`.
- Unknown Judge reveal ids are ignored.
- Player knowledge records contain only display-safe read ids and read text.
- Hard stops reveal the player-facing boundary that caused the stop.
- Deterministic non-hard-stop dates use the documented largest applied consequence rule before filing any reveal.
- Final reports and notes reinforce earned knowledge without exposing raw tags, rule hit ids, prompt text, exact Date Health, or exact internal stat math.
- Live date UI keeps exact Date Health visible.
- Runtime AI still receives the private context it needs to perform characters and judge exchanges.
