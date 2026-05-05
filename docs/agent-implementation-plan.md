# Agent Implementation Plan

This plan is ordered by blockers. Work top to bottom unless a task explicitly says it can run in parallel.

Update task status in this file when starting or finishing work:

- `[ ]` not started
- `[~]` in progress
- `[x]` complete

Each task is complete only when its "Done when" items are true.

## P0. Baseline

### [x] P0.1 Verify Project Baseline

Dependencies: none

Actions:

- Run install if dependencies are missing.
- Run `pnpm typecheck`.
- Run `pnpm build`.
- Record any existing failures before changing code.

Done when:

- The baseline command results are known.
- Any unrelated existing failures are documented in the task handoff.

Baseline results:

- `vp install` passed.
- `vp run typecheck` passed.
- `vp build` passed.
- `vp check` failed before implementation work because formatting issues already exist in `app/app.css`, `app/root.tsx`, `app/routes/home.tsx`, `app/welcome/welcome.tsx`, `docs/world/voice.md`, `package.json`, and `tsconfig.json`.

## P1. Domain Model Foundation

### [x] P1.1 Add Core Domain Types And Schemas

Dependencies: P0.1

Actions:

- Add shared domain types for members, portraits, scenarios, goals, shifts, pairs, dates, messages, judge results, and memory records.
- Add Zod schemas where runtime validation is needed.
- Include a neutral portrait set with both `portrait` and `avatar`, and leave room for future expression variations.
- Represent date length as configurable, defaulting to 30 total character messages.

Done when:

- Types compile.
- Schemas validate fixture-shaped objects.
- No UI code owns domain-only types.

### [x] P1.2 Add Code-First Fixture Files

Dependencies: P1.1

Actions:

- Add 6 member fixtures under `app/fixtures/members`.
- Add 6 scenario fixtures under `app/fixtures/scenarios`.
- Add starter company goals and member requests under `app/fixtures/goals`.
- Add a fixture index/export file for each fixture group.
- Reference neutral portrait and avatar source/cutout paths from member fixtures.
- Include concise portrait and avatar prompt seeds for each member based on `docs/world/visual-design.md`.

Done when:

- Fixture exports validate against domain schemas.
- There are exactly 6 starter members and 6 starter scenarios.
- Every member has `portraits.neutral.portrait` and `portraits.neutral.avatar` references.

## P2. Local Storage And Memory

### [x] P2.1 Add Repository Interfaces

Dependencies: P1.1

Actions:

- Define repositories for members, pair states, date sessions, transcripts, shifts, scenario deck state, and memory records.
- Keep game code calling repository interfaces rather than direct database APIs.
- Include methods for storing and querying memory embeddings.

Done when:

- Repository interfaces compile.
- Interfaces cover all v1 save data listed in `docs/gameplan.md`.

Implementation notes:

- `app/repositories/game-repository.ts` defines aggregate save, member, pair, shift, scenario deck, transcript, date session, and memory operations.
- Memory search requires an explicit viewer context so member-private and judge-only visibility is enforced before returning records.

### [x] P2.2 Implement Local Persistent Storage

Dependencies: P2.1

Actions:

- Implement a local persistent storage adapter for canonical game state.
- Prefer a local Node/server-side adapter compatible with React Router server routes.
- Keep the adapter replaceable for later Tauri packaging.
- Add a seed/reset path that loads fixtures into a new save.

Done when:

- A fresh local save can be created from fixtures.
- Members, pair states, shifts, date sessions, transcripts, and memory records persist across app reloads.
- Storage code is not coupled to UI components.

Implementation notes:

- Browser play uses a `localStorage` repository adapter.
- React Router server routes can use `NodeJsonStorageDriver` for replaceable local JSON persistence under `.idc-data`.
- `MemoryStorageDriver` remains test-only.

### [x] P2.3 Implement Vector Memory Search

Dependencies: P2.1

Actions:

- Add local embedding storage and similarity search for `MemoryRecord`.
- Metadata filters must support subject IDs, pair ID, scenario ID, visibility, scope, and tags.
- Hide vector-store details behind the memory repository.
- Use a replaceable adapter if the first vector backend changes.

Done when:

- A smoke test or script inserts memory records with embeddings and retrieves nearest matches.
- Metadata filters work with vector search.
- Search returns stable IDs and scores.

Implementation notes:

- Vector search is hidden behind the memory repository and only searches records with stored embeddings.
- Smoke tests cover subject, pair, scenario, visibility, scope, tag, and viewer enforcement.

## P3. AI SDK And Ollama

### [x] P3.1 Add AI Provider Adapter

Dependencies: P1.1

Actions:

- Add AI SDK dependencies.
- Implement an Ollama provider adapter.
- Try `ai-sdk-ollama` first.
- Keep an OpenAI-compatible Ollama adapter as fallback.
- Add config slots for performer, judge, summarizer, and embedding models.

Done when:

- A local text generation smoke test works against Ollama.
- Model config can be changed without editing prompt code.
- Provider-specific code is isolated.

Implementation notes:

- `app/services/ai/ollama-provider.server.ts` uses `ai-sdk-ollama` first and OpenAI-compatible Ollama as fallback.
- Local smoke passed with `IDC_RUN_OLLAMA_SMOKE=1 vp test app/services/ai/ollama-provider.server.test.ts`.

### [x] P3.2 Add Embedding Generation

Dependencies: P3.1

Actions:

- Implement `embedMemoryText()`.
- Default embedding model: `embeddinggemma`.
- Store model name and embedding dimensions with each embedding record.
- Handle missing model or Ollama connection errors clearly.

Done when:

- A local embedding smoke test returns a vector.
- Embedded memory records can be stored through the memory repository.

Implementation notes:

- `embedMemoryText()` stores model name and dimensions with returned embeddings.
- `embeddinggemma` was pulled locally and the explicit Ollama smoke test returned an embedding vector.

## P4. Retrieval And Tool Calling

### [x] P4.1 Build Deterministic Memory Pack Retrieval

Dependencies: P2.3, P3.2

Actions:

- Implement `retrieveRelevantMemories()`.
- Retrieve required context before each character generation.
- Include recent transcript window, pair memories, member-visible memories, scenario memories, and repeated-scenario memories.
- Enforce visibility rules before memories enter prompts.
- Keep prompt context bounded; do not concatenate full history.

Done when:

- Retrieval returns a bounded memory pack for each character.
- Private memories are excluded unless visible to that character.
- Long transcript history is summarized or windowed.

Implementation notes:

- `retrieveRelevantMemories()` returns bounded self, pair, scenario, judge, and recent transcript packs.
- Character retrieval excludes judge-only records and member-private records not visible to the requesting member.

### [x] P4.2 Add Scoped Memory Search Tool

Dependencies: P4.1, P3.1

Actions:

- Implement `searchCupidMemory()` as a tool available to character performers.
- Tool input scope: `self`, `pair`, `scenario`.
- Tool execution must enforce character visibility and date context.
- Limit returned memories by count and text length.

Done when:

- Character generation can call the tool.
- Tool calls cannot retrieve another member's private memory.
- Tool results appear in AI SDK generation steps for debugging.

Implementation notes:

- `searchCupidMemory()` implements `self`, `pair`, and `scenario` scope filtering with count and text limits.
- The tool service enforces visibility in application code before returning text to a character performer.

## P5. Date Simulation

### [x] P5.1 Build Prompt Context Assembler

Dependencies: P4.1

Actions:

- Build prompt packets for Character Performer, Judge, Director, and Summarizer.
- Separate scenario `card`, `publicBrief`, `director`, and `judgeRubric` data.
- Treat Cupid intervention text as in-world content, not system instructions.
- Include only current beat data for character performers.

Done when:

- Prompt packets can be inspected in a dev/debug path.
- Character prompts never include future scenario beats or judge-only data.

Implementation notes:

- `app/services/date-prompts.ts` builds character, judge, director, and summarizer packets.
- Character packets include only the current beat and bounded retrieved context.

### [x] P5.2 Implement Date Engine

Dependencies: P5.1, P4.2

Actions:

- Implement date sessions with 30 total character messages by default.
- Use strict speaker alternation for v1.
- Support scenario beats between messages.
- Support one player intervention per date.
- End early if date health reaches zero.

Done when:

- A full 30-message date can run locally.
- A date can end early.
- The transcript records character messages, scenario beats, and Cupid intervention messages.

Implementation notes:

- `app/services/date-engine.ts` supports strict alternation, scenario beat insertion, one intervention, completion, and early ending.
- Deterministic performer fallback keeps smoke paths playable without blocking on local model latency.

### [x] P5.3 Implement Judge Loop

Dependencies: P5.2, P3.1

Actions:

- Run judge after each exchange.
- Use structured output and Zod validation.
- Update date health, member mood, and pair stats.
- Produce final date report.

Done when:

- Judge output is validated before state updates.
- Invalid judge output is handled without corrupting state.
- Final report is persisted.

Implementation notes:

- Deterministic judge snapshots are validated with Zod before state updates.
- The local AI adapter also exposes structured judge generation for Ollama-backed paths.

### [x] P5.4 Implement Memory Summarizer

Dependencies: P5.3, P3.2

Actions:

- Summarize completed dates into memory candidates.
- Validate memory records.
- Embed memory text.
- Store memories with visibility, scope, importance, and metadata.

Done when:

- Completing a date creates retrievable memory records.
- Those memories affect a later date through deterministic retrieval.

Implementation notes:

- Completed dates create pair, member-private, and scenario repeat memories with explicit embeddings.
- Repeated scenario history affects later date transcripts and judge penalties.

## P6. Shift Game Loop

### [x] P6.1 Implement Scenario Deck And Shift State

Dependencies: P2.2, P1.2

Actions:

- Seed a starting deck from the 6 scenario fixtures.
- Draw 3 scenarios per shift.
- Track 3 date slots per shift.
- Track repeated scenario use by pair.
- Add end-of-shift scenario deck change data model.

Done when:

- A seeded shift draws 3 scenarios.
- Used date slots persist.
- Repeated scenario usage is queryable.

Implementation notes:

- Seeded saves draw 3 scenarios, track 3 date slots, and store repeated scenario counts per pair.
- Shift state and scenario deck state persist through the repository.

### [x] P6.2 Implement Goals, Requests, And Follow-Up Actions

Dependencies: P6.1, P5.3

Actions:

- Pin company goals and member requests to shift state.
- Score company goals at shift end.
- Apply member-request consequences to member mood/trust.
- Implement fixed follow-up actions: `Encourage`, `Cool Down`, `Repair`, `Mark Bad Fit`.

Done when:

- A full shift can be scored.
- Follow-up actions change pair/member state.
- Pinned goals/requests persist through reload.

Implementation notes:

- Shift scoring covers completed dates, early endings, cross-reality dates, and member mood delta.
- Follow-up actions adjust pair stats and persist on the final date report.

## P7. UI Integration

### [x] P7.1 Build Static Dashboard UI

Dependencies: P1.2

Actions:

- Replace starter route with Cupid Operations Dashboard.
- Show member board, pinned goals, pinned requests, scenario hand, selected match panel, and shift status.
- Leave exact layout decisions to the implementing UI agent.

Done when:

- The app starts on a playable dashboard shell.
- Two members can be selected.
- Today's scenarios are visible.

### [x] P7.2 Wire Dashboard To Game State

Dependencies: P6.2, P7.1

Actions:

- Start dates from selected members and selected scenario.
- Show active transcript, date health, intervention input, judge updates, and final report.
- Show post-date follow-up actions.
- Show shift-end report.

Done when:

- One complete shift is playable from the UI.
- Reloading does not lose persisted shift state.

Implementation notes:

- The dashboard now loads or seeds a local save, starts dates, advances or resolves the transcript, records one intervention, shows judge updates, applies follow-ups, and shows a shift report.
- Playwright validated the start date, send nudge, resolve date, Repair follow-up, and end shift path.

## P8. Portrait Pipeline

### [~] P8.1 Generate And Process Neutral Portrait Sets

Dependencies: P1.2

Can run in parallel after member fixtures exist.

Actions:

- Generate one neutral full-body portrait and one neutral avatar per member against a white background.
- Follow the portrait style in `docs/world/visual-design.md`.
- Store source images in `public/assets/portraits/source`.
- Run `vp run portrait:cutout`.
- Store transparent cutouts in `public/assets/portraits/cutout`.

Done when:

- Each starter member has source portrait, source avatar, portrait cutout, and avatar cutout.
- Member fixtures reference the portrait and avatar cutout paths used by UI.
- Portraits pass the acceptance checks in `docs/world/visual-design.md`.

Progress:

- Vhool and Mr. Whiskers source and cutout files are present locally, pending human approval before check-in.
- Portrait docs and prompt seeds now name webtoon/manhwa/manhua as the asset style direction.

## P9. Verification

### [x] P9.1 Add Developer Smoke Tests

Dependencies: P5.4, P6.2

Actions:

- Add smoke checks for fixture validation, storage seed, embedding generation, memory search, date simulation, judge validation, and shift scoring.
- Keep smoke tests runnable without external cloud services.

Done when:

- A local agent can verify the core loop with one command or documented sequence.
- Failures identify the broken subsystem.

Implementation notes:

- `vp test` runs offline smoke tests for fixtures, repository seeding, memory search, full date simulation, follow-up actions, shift scoring, and repeated scenario history.
- `IDC_RUN_OLLAMA_SMOKE=1 vp test app/services/ai/ollama-provider.server.test.ts` verifies local text and embedding calls against Ollama.
