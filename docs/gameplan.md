# Interdimensional Dating Coach Game Plan

Interdimensional Dating Coach, or IDC, is a local-first relationship management game presented through a messaging-app and dating-app management dashboard. The player is an employee of Cupid, an interdimensional dating service that matches members across worlds, timelines, species, and metaphysical states.

Many Cupid members think they signed up for a normal dating app. In practice, the member pool includes regular humans, talking animals, eldritch gods, ghosts, cursed royalty, time-displaced professionals, and other people or entities who are technically single.

The core game is a shift-based relationship graph management game. The player manages a many-to-many dating pool, creates matches, sends pairs on authored date scenarios, watches local-LLM-driven date transcripts unfold, uses one optional intervention per date, and tries to improve the state of the overall member pool.

This is a working product and technical plan. It should evolve as we prototype the date simulation and learn what actually feels fun.

## Locked Product Decisions

- The game is called **Interdimensional Dating Coach**, or **IDC**.
- The player works for **Cupid**, an interdimensional dating service.
- The player manages the dating pool; they are not personally dating the characters.
- The game is **shift based**.
- The main screen should feel like a **management dashboard**, not a step-by-step wizard.
- Characters are preauthored members in a many-to-many dating pool.
- Everyone is open to dating everyone in v1. There are no "seeking man/woman/etc." filters or matching goals.
- The player has **one freeform intervention per date**.
- Date scenarios come from a reusable **scenario deck**.
- Each member has one neutral/baseline portrait for v1.
- Portraits use the webtoon/manhua direction in `docs/world/visual-design.md`.
- Generated portraits should start on a white background, then be converted to transparent PNG cutouts locally.
- The game uses local LLMs only, with Ollama as the first target.
- The app owns canonical state and memory. The LLM performs and judges; it does not own the source of truth.
- The first playable scope is 6 members, 6 starter scenarios, 3 drawn scenarios per shift, and one complete playable shift.
- Default date length is 30 total character messages, or 15 exchanges, unless the date ends early.
- Vector embeddings, semantic retrieval, and scoped memory tool calling are v1 requirements.

## Current Technical Direction

The project is a web app first, with no traditional game engine.

Chosen stack:

- Vite+ project structure
- React Router
- React
- TypeScript
- Tailwind CSS v4
- AI SDK patterns for generation, streaming, tool calling, embeddings, and structured output
- Local Ollama integration
- Local-first saves, content, and memory
- Python portrait asset tooling using rembg with the `bria-rmbg` model

Likely additions:

- AI SDK Core
- An AI SDK Ollama community provider or an OpenAI-compatible provider pointed at Ollama
- Zustand for client game state
- Zod for validating character files, scenario files, save data, memory records, and LLM judge outputs
- SQLite for local canonical state and memory if we keep using React Router server routes or later package with Tauri
- IndexedDB/Dexie only if we need a simpler browser-only persistence layer during early prototyping
- Local vector search in v1, likely through SQLite vector search or an embedded vector database
- Tauri later if the game needs desktop packaging for itch, Steam, or easier local model integration

Not planned for now:

- Cloud backend
- Cloud LLM calls
- Unity, Godot, Phaser, or a visual novel engine

Reasoning:

IDC is mostly interface, state, authored content, and LLM orchestration. A web app is a better fit than a game engine because the primary experience is a Cupid operations dashboard: member cards, pinned goals, relationship state, date transcripts, interventions, and post-date reports.

## Product Pillars

### 1. Cupid Operations Dashboard

The primary screen should feel like an employee dashboard for a strange dating service.

Important dashboard elements:

- Member board with profile cards
- Pinned company goals
- Pinned member requests
- Today's available date scenario cards
- Selected match panel
- Active date transcript panel/drawer
- Shift status and remaining date slots

This should not be a linear stepper. The player should feel like they are juggling a small but messy service desk.

### 2. Messaging App Meets Dating App

The game should feel like a dating platform, messaging client, and internal operations tool collapsed into one interface.

Core surfaces:

- Member profiles
- Member board
- Match detail panel
- Relationship dashboard
- Date transcript screen
- Cupid intervention message
- Post-date report
- Long-term relationship history

The date itself appears as a chat transcript, similar to an iMessage or dating-app conversation, but fictionally it represents the transcript of a live date.

### 3. Authored Characters With AI Performance

Characters are preauthored, not randomly generated from scratch.

Each member should have:

- Name
- Origin, species, dimension, or reality status
- Bio
- Dating profile text
- Personality traits
- Voice rules
- Relationship needs
- Red flags
- Preferences
- Dealbreakers
- Secrets or hidden context
- Tags used by matchmaking and scenario logic
- Current member mood
- Current member request, if any

The local LLM performs the character during dates, but the game owns the canonical character data, relationship state, memories, and date history.

### 4. Authored Date Scenario Deck

Dates should be preauthored as funny, weird, and high-pressure setups.

The player has a reusable date scenario deck. Each shift randomly offers a small hand of scenarios from that deck, likely 3. Scenarios are not consumed on use. Reusing the same scenario can be funny and mechanically meaningful, especially if the same pair notices Cupid has sent them on the exact same date again.

Example scenario types:

- Coffee date in a cafe where time moves backward
- Museum date where one character is technically an exhibit
- Double date with alternate-universe exes
- Dinner date where every course reveals a childhood memory
- Karaoke date where the songs predict future breakups

The scenario should act like a director, applying pressure over time instead of letting the LLM conversation drift.

### 5. Portrait-Driven Member Identity

Each member should have one generated neutral/baseline portrait in v1.

Portrait rules:

- One portrait per member for the first playable build.
- Use a webtoon/manhua inspired portrait style.
- Generate against a plain white background.
- Store source portraits separately from transparent cutouts.
- Remove backgrounds locally using rembg and the `bria-rmbg` model.
- Use transparent cutouts in the UI so AI agents can design cards, profiles, and date surfaces around them.
- Keep enough abstraction for later portrait variations such as neutral, flirty, confused, angry, embarrassed, or furious.
- Follow `docs/world/visual-design.md` for portrait prompts, acceptance checks, and UI usage.

Future-facing portrait shape:

```ts
type MemberPortraits = {
  neutral: PortraitAsset;
  flirty?: PortraitAsset;
  confused?: PortraitAsset;
  angry?: PortraitAsset;
};

type PortraitAsset = {
  sourcePath: string;
  cutoutPath: string;
  prompt?: string;
  model?: string;
};
```

For now, only `neutral` is required.

## Core Shift Loop

Each shift gives the player a small number of meaningful actions.

Recommended v1 structure:

- 3 date slots per shift
- 2 company goals pinned to the dashboard
- 3 member requests pinned to the dashboard
- 3 date scenarios drawn from the player's scenario deck
- 30 total character messages per date by default
- 1 optional freeform intervention per date
- 1 follow-up decision after each date

Expected player flow:

1. Start on the Cupid Operations Dashboard.
2. Review pinned company goals and member requests.
3. Select two member cards from the board.
4. Review the selected match panel.
5. Choose one of today's available date scenarios.
6. Start the date transcript.
7. Optionally send one freeform Cupid intervention.
8. Let the date resolve through turn limit, early ending, or normal completion.
9. Review the judge report.
10. Choose one follow-up action.
11. Repeat until date slots are used or the player ends the shift.
12. Receive an end-of-shift report and a scenario deck change opportunity.

Depth should come from simple constraints:

- Which members should be matched?
- Which goals are worth pursuing?
- Which member requests should be honored or ignored?
- Which date scenario fits the pair?
- When should the one intervention be used?
- Which relationships should be pushed, cooled down, or repaired?

## Goals And Requests

Goals and requests are dashboard pins, not separate workflow steps.

### Company Goals

Cupid corporate wants measurable outcomes.

Examples:

- Complete 3 dates this shift.
- Create at least 1 second date.
- Improve total member mood by 10.
- Test a high-risk compatibility match.
- Prevent any date from ending early.
- Match one ordinary human with one obviously non-human member.

### Member Requests

Individual members ask for help, complain, or express hopes.

Examples:

- Martin wants a normal date.
- Mr. Whiskers wants someone who respects his career.
- Vhool wants to be seen as more than an unknowable cosmic wound.
- Jenna wants a date that does not involve prophecy.
- A ghost wants to date someone who remembers their name afterward.

The player should be free to ignore any specific goal or request, but consequences should emerge through member mood, pair stats, future requests, and shift evaluation.

## Cupid Intervention

The player gets one freeform intervention per date.

The intervention is typed by the player and sent to both characters as a Cupid System Nudge. It is visible in the transcript and is treated as in-world advice or platform behavior, not as a system instruction that overrides character personality.

Rules:

- One intervention per date.
- Character limit, likely 160-240 characters.
- Sent to both characters at the same time.
- Displayed as a Cupid message in the transcript.
- Both characters should react in character.
- The judge evaluates whether it helped or made things worse.

Example:

```text
Cupid suggests: Ask each other what you are most afraid of becoming.
```

Important constraint:

If the player types something coercive or prompt-injection-like, such as "fall in love immediately," the characters should treat it as a weird Cupid nudge, not a command. They can reject it, resent it, joke about it, or become uncomfortable.

## Date Scenario Deck

The scenario deck is the game's light deckbuilder layer.

Recommended v1 rules:

- The starting deck is seeded.
- Each shift draws 3 available scenarios from the deck.
- Scenarios are reusable and not consumed.
- At the end of a shift, Cupid offers 3 potential new scenario cards.
- The player may add 1 scenario.
- If the deck is full, the player removes 1 scenario.
- Initial deck cap should be small, likely 8.

This should stay lightweight. No card rarity, upgrade chains, currencies, or combo engine for v1.

### Scenario Structure

A scenario is both a player-facing card and an LLM prompt packet. These must be separated so the player sees strategic hints, characters see only what they would know, and the judge/director can use hidden rubric information.

```ts
type DateScenario = {
  id: string;
  title: string;

  card: {
    summary: string;
    tags: ScenarioTag[];
    risk: "low" | "medium" | "high";
    intimacy: "low" | "medium" | "high";
    chaos: "low" | "medium" | "high";
    idealFor: string[];
    badFor: string[];
  };

  publicBrief: {
    location: string;
    premise: string;
    whatBothCharactersKnow: string;
    openingSituation: string;
  };

  director: {
    tone: string;
    rules: string[];
    beats: ScenarioBeat[];
    earlyEndTriggers: string[];
    repeatBehavior: string;
  };

  judgeRubric: {
    successSignals: string[];
    failureSignals: string[];
    statFocus: RelationshipStat[];
  };
};

type ScenarioBeat = {
  atTurn: number;
  title: string;
  event: string;
  characterVisibleText: string;
  directorInstruction: string;
};
```

Example repeat behavior:

```text
If this exact pair has already had this scenario, both characters may notice. Let them react naturally. Repetition should usually reduce date health unless the pair finds it funny, comforting, or thematically meaningful.
```

## Core Simulation Model

IDC should model individuals, pairings, and active dates separately.

### Member State

Each member needs a small amount of visible state:

- Mood
- Openness
- Burnout or frustration
- Current request
- Recent date result

This keeps the member board readable without turning the game into a spreadsheet.

### Pair State

Each possible pair can accumulate history.

Visible pair stats should stay simple:

- Spark
- Strain
- Relationship health

Internally, relationship health can be derived from several stats:

- Chemistry
- Trust
- Stability
- Conflict
- Weirdness tolerance

This gives the design more range. A pair can be magnetic but unstable, healthy but dull, deeply trusting but low chemistry, or weirdly compatible in ways the player can exploit.

### Date Health

Date health is a visible health bar for the current date session.

It can rise or fall as the date progresses. If it reaches zero, the date can end early.

Date health represents:

- Momentum
- Comfort
- Mutual engagement
- Emotional safety
- Whether the scene is still recoverable

It does not directly mean the relationship is dead. A terrible date can become a funny story, a dramatic turning point, or the end of the pairing depending on the final judge result.

## LLM Architecture

The game should use AI SDK patterns where possible, but game systems should call domain-level functions instead of provider APIs directly.

Required app-level functions:

- `generateCharacterTurn()`
- `judgeDateExchange()`
- `summarizeDateMemories()`
- `retrieveRelevantMemories()`
- `embedMemoryText()`
- `searchCupidMemory()`

The game should not rely on the LLM provider to own conversation memory. The game owns all state and builds the context for each generation.

There are four main LLM roles:

### Character Performer

Generates a single character's next message during a date.

Input context:

- Character profile
- Character voice rules
- Character-visible memory pack
- Private character state
- Current pair state
- Date scenario public brief
- Current visible scenario beat
- Recent transcript window
- Cupid intervention, if used
- Current date health
- Output constraints

Output:

- One in-character message
- Optional private state update
- Optional emotion/intent metadata

### Date Director

Controls pacing and scenario pressure.

This can be deterministic at first and optionally LLM-assisted later.

Responsibilities:

- Start the date
- Track turn count
- Trigger scenario beats
- Decide when interruptions happen
- Keep conversations from drifting
- Apply constraints for unusual scenarios
- Handle repeated scenario context

### Judge

Evaluates the date after each exchange or at key checkpoints.

The judge should use structured output validated by Zod.

Suggested output:

- Date health delta
- Chemistry delta
- Trust delta
- Stability delta
- Conflict delta
- Weirdness tolerance delta
- Member mood deltas
- Whether the date should end early
- Reason for early ending
- Notable moments
- Player-facing summary
- Memory candidates
- Private debug notes, if useful during development

The judge pass is important because it turns freeform LLM text back into game state.

### Memory Summarizer

Creates compact memory records after important events, especially after dates.

Responsibilities:

- Summarize what happened.
- Decide which memories belong to a member, pair, date, scenario, or company scope.
- Assign visibility.
- Assign importance.
- Produce embedding text.
- Avoid storing huge transcript chunks as routine prompt context.

## App-Owned Memory And Retrieval

IDC should use local, app-owned memory with summarized records and semantic retrieval in v1.

The game should not shove every historical transcript into each prompt. Instead, it should store compact memory records and retrieve a small, relevant memory pack before generation.

Important principle:

- Required context should be retrieved deterministically by the game.
- Optional extra context can be retrieved through narrow tool calls during generation.
- The LLM can ask for memory, but the game remains the source of truth.
- Tool results must respect memory visibility rules.
- Long dates depend on retrieval; prompt construction must not concatenate all prior transcript and relationship history.

Suggested memory shape:

```ts
type MemoryRecord = {
  id: string;
  scope: "member" | "pair" | "date" | "scenario" | "company";
  visibility: "public" | "member_private" | "judge_only";
  subjectIds: string[];
  pairId?: string;
  scenarioId?: string;
  dateSessionId?: string;
  text: string;
  tags: string[];
  importance: number;
  createdAt: string;
  embedding?: number[];
};
```

Example memories:

- Derek felt overwhelmed by Vhool's cosmic metaphors but appreciated their sincerity.
- Vhool remembers Derek asking a genuinely kind follow-up question.
- Derek and Vhool have already gone to Temporal Coffee Shop once and noticed the repetition.
- Martin is losing trust in Cupid after two weird dates in a row.

### Memory Visibility

Visibility matters.

A character should not retrieve another character's private fears, secrets, or internal judge notes unless the game has made that information visible. The judge can see more than character performers. The director can see scenario history. Character performers only get what their character would plausibly know.

### Memory Tool

Character performers should have a narrow memory search tool in v1:

```ts
type SearchCupidMemoryInput = {
  query: string;
  scope: Array<"self" | "pair" | "scenario">;
  limit: number;
};
```

The tool should enforce visibility and scope in application code. Tool calling should help with memory lookup, not replace deterministic context building.

## Thread Model

When we talk about "LLM threads," the game should treat them as game-owned prompt contexts rather than provider-owned threads.

Suggested shape:

```ts
type DateSession = {
  id: string;
  matchId: string;
  scenarioId: string;
  turnLimit: 30;
  currentTurn: number;
  dateHealth: number;
  status: "active" | "completed" | "ended_early";
  participants: [CharacterId, CharacterId];
  transcript: DateMessage[];
  privateStateByCharacter: Record<CharacterId, CharacterDateState>;
  judgeSnapshots: JudgeSnapshot[];
  intervention?: CupidIntervention;
};
```

Each character has a separate prompt context, but both contexts read from the same canonical transcript, date state, relationship state, and scoped memory records.

This avoids hidden provider state becoming the source of truth.

## Expected Date Flow

1. Player selects two members from the member board.
2. Game shows selected match context and known pair history.
3. Player chooses one of today's drawn date scenarios.
4. Game creates a `DateSession`.
5. Date Director creates the opening context.
6. Game retrieves a small memory pack for each character and the judge.
7. Character A generates a message.
8. Character B generates a response.
9. Judge evaluates the exchange.
10. Date health, member mood, and relationship stats update.
11. Scenario beat may trigger.
12. Player may use the one Cupid intervention.
13. Loop continues until the turn limit, early ending, or date completion.
14. Judge creates a final date report.
15. Memory Summarizer creates memory records.
16. Relationship state persists to the match history.
17. Player chooses one follow-up action.

## Content Files

IDC should keep authored game content separate from app code, but the first prototype should use code-first fixture files. This keeps iteration and refactoring easy while the data model is still changing.

Suggested structure:

```text
app/
  fixtures/
    members/
    scenarios/
    goals/
public/
  assets/
    portraits/
      source/
      cutout/
scripts/
  portraits/
docs/
  gameplan.md
  world/
    visual-design.md
```

Fixture guidance:

- Start with separate TypeScript fixture files per member and per scenario.
- Keep fixtures small and easy to move.
- Validate fixture shapes with Zod or TypeScript types.
- Move to JSON or YAML only after the data model stabilizes.
- Keep generated source portraits and processed cutouts out of fixture code; reference them by path.

## Portrait Asset Pipeline

The repo includes a local Python script for removing portrait backgrounds:

```text
scripts/portraits/remove_background.py
```

Install portrait tooling:

```sh
python -m pip install -r requirements/portraits.txt
```

Process a single portrait:

```sh
pnpm portrait:cutout -- --input public/assets/portraits/source/member-id.png --output public/assets/portraits/cutout/member-id.png
```

Process a folder:

```sh
pnpm portrait:cutout -- --input public/assets/portraits/source --output public/assets/portraits/cutout --recursive --overwrite
```

Default model:

```text
bria-rmbg
```

This keeps background removal local and repeatable. The script uses rembg as a dependency instead of vendoring the whole rembg repository. Rembg supports CLI/library use, Python >=3.11 and <3.14, automatic model downloads, and `bria-rmbg` as an available model.

## Save Data

Saves should be local-first.

Likely save data:

- Player profile/settings
- Current shift state
- Known members
- Scenario deck
- Match history
- Pair states
- Member states
- Completed date transcripts
- Memory records
- Embeddings
- Unlocked scenarios
- Debug/replay data during development

Persistence target:

- SQLite if using local React Router server routes or Tauri
- IndexedDB if the early prototype stays browser-only
- Same app data model can later be exported/imported as JSON

## UI Direction

IDC should feel like a practical but uncanny relationship operating system.

Visual direction:

- Dense enough to feel like an app the player uses repeatedly
- Member board as the home screen
- Pinned goals and requests on the same screen
- Dating profile cards for members
- Selected-pair side panel instead of a giant graph for v1
- Messaging bubbles for date transcripts
- A distinct Cupid message style for interventions
- Health bars and status chips for relationship/date state
- Strong character flavor, but not a generic marketing landing page

Important screens or panels:

- Cupid Operations Dashboard
- Member profile
- Selected match panel
- Scenario hand/deck panel
- Active date transcript
- Post-date report
- End-of-shift report
- Content/debug playground for testing prompts

## Near-Term Implementation Plan

### Milestone 1: Static Dashboard Prototype

Goal: prove the interface shape without LLM complexity.

Tasks:

- Replace starter screen with Cupid Operations Dashboard
- Add 6 sample member fixtures
- Add 6 sample scenario fixtures
- Add neutral portrait references for each member
- Show pinned company goals and member requests
- Render member board
- Allow selecting two members
- Show selected match panel
- Show today's 3 scenario cards
- Fake a date transcript from static messages
- Show date health, member mood, pair spark, and pair strain

### Milestone 2: Local Memory, Embeddings, And Retrieval

Goal: make long LLM dates possible without huge prompts.

Tasks:

- Add local canonical storage for members, pair states, date sessions, transcripts, and memory records
- Add embedding generation through Ollama/AI SDK
- Store embeddings for memory records
- Add semantic memory search with metadata filters
- Add deterministic memory pack retrieval for character, pair, scenario, and judge context
- Add scoped `searchCupidMemory` tool with visibility enforcement

### Milestone 3: Local AI SDK/Ollama Spike

Goal: prove one date can run through local LLM calls using AI SDK-style app functions.

Tasks:

- Add AI SDK dependencies and provider setup
- Add model selection/config
- Add domain-level LLM functions
- Generate one character response at a time
- Allow the character performer to use the scoped memory tool
- Add streaming UI if it feels worthwhile
- Add timeout/error states
- Add a developer prompt playground

### Milestone 4: Judge Loop

Goal: convert transcript text into game state.

Tasks:

- Define Zod schema for judge output
- Run judge after each exchange or checkpoint
- Update date health
- Update member mood
- Update pair stats
- End date early at zero health
- Generate final date report
- Persist completed date session locally

### Milestone 5: Scenario Deck And Shift Loop

Goal: make the shift structure playable.

Tasks:

- Seed starting scenario deck
- Draw 3 scenarios per shift
- Track 3 date slots
- Add end-of-shift report
- Offer scenario deck change after each shift
- Track repeated scenario use

### Milestone 6: Portrait Pipeline

Goal: make member identity visually reusable without committing to expression variants yet.

Tasks:

- Generate one neutral portrait per member on a white background
- Follow the webtoon/manhua style rules in `docs/world/visual-design.md`
- Store source portraits in `public/assets/portraits/source`
- Remove backgrounds with the local rembg script
- Store transparent PNG cutouts in `public/assets/portraits/cutout`
- Reference portraits through member fixtures
- Leave room in the fixture shape for future expression variants

### Milestone 7: Relationship Progression

Goal: make repeated dates matter through memory-backed state changes.

Tasks:

- Summarize completed dates into memory records
- Add memory visibility rules
- Let prior dates affect future prompts
- Let repeated scenarios affect prompts and judge results
- Let pair state and member state evolve across shifts

## Remaining Decisions And Hanging Questions

### First Prototype Scope

Locked recommendation:

- 6 members
- 6 starter scenarios
- 3 drawn scenarios per shift
- 3 date slots per shift
- 1 complete playable shift
- 1 neutral portrait per member

### Date Length And Pacing

Locked recommendation:

- 30 total character messages by default
- 15 exchanges per normal full date
- Dates can end early when date health reaches zero
- Judge runs after each exchange, plus a final report
- Strict speaker alternation for v1
- Scenario beats can be inserted between character messages

### Follow-Up Actions

Locked recommendation:

- Use fixed buttons for v1.
- Actions: `Encourage`, `Cool Down`, `Repair`, `Mark Bad Fit`.
- No freeform follow-up text in v1.

### Goals And Requests

Locked recommendation:

- Company goals score shift performance.
- Member requests are preauthored in v1.
- Ignoring a member request primarily affects that member's mood/trust.
- Repeatedly ignoring requests can affect Cupid performance later.

### Memory System

Locked recommendation:

- Include vector embeddings and semantic retrieval in v1.
- Include scoped memory tool calling in v1.
- Use deterministic memory retrieval before each generation.
- Retain raw transcripts for replay/debugging.
- Use summaries and selected recent transcript windows for prompts.
- Default embedding model should be `embeddinggemma`, configurable.

### LLM Provider Details

- Which AI SDK Ollama provider should be used first?
- Should structured outputs use AI SDK structured generation, Ollama JSON schema support, or both through an adapter?

Locked recommendation:

- Try `ai-sdk-ollama` first.
- Keep an OpenAI-compatible Ollama adapter as fallback.
- Performer and judge use the same model by default.
- Keep separate config slots for performer, judge, summarizer, and embeddings.
- Judge and summarizer use lower temperature.
- Tool calling is enabled for character performers in v1, limited to scoped memory search.

### Character Design

- How much hidden state should characters have?
- How strongly should characters remember and react to repeated bad Cupid behavior?
- Should members be allowed to refuse future dates with specific members?

### UI Shape

- Leave UI-specific layout decisions to implementation agents, as long as they preserve the dashboard feel and the locked product loop.

## Current Working Assumptions

- The game is local LLM only.
- Ollama is already installed and available for development.
- The player understands they are managing relationships, not directly dating the characters.
- The app owns all canonical state.
- LLM output should be bounded and judged into structured game state.
- RAG and memory retrieval are context selection tools, not the source of truth.
- Vector embeddings and scoped memory tool calling are part of the first playable architecture.
- A traditional game engine is unnecessary for the first version.
