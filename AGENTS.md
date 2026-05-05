# Agent Instructions

## Agent Autonomy

- Read relevant code, and `docs` before changing code. You must draw your knowledge from code instead of guessing
- Challenge requests that conflict with the active plan, product docs, architecture, or current implementation evidence.
- Be critical. Push back when a request creates scope drift, weak architecture, or brittle gameplay behavior.
- Avoid sprawl. Prefer existing patterns, shared domain types, and reusable game services over duplicate functions or components.
- Always use the `frontend-skill` when creating or heavily refactoring UI components or screens.

## Toolchain

- Use Vite Plus first: `vp install`, `vp dev`, `vp check`, `vp test`, `vp build`, and `vp preview`.
- Use package scripts only where there is no `vp` equivalent.
- Run project scripts through Vite Plus when possible, for example `vp run portrait:cutout`.
- Playwright browser testing is the primary development and validation surface for UI and gameplay flows.

## Architecture

- App-owned canonical state is authoritative for gameplay. Runtime local AI never owns gameplay authority.
- Domain types and schemas own contracts.
- Fixtures own static gameplay definitions.
- Game services own gameplay consequences.
- Repositories and save code own persistence, serialization, and migration. They do not repair gameplay.
- UI owns presentation and typed user intents only.
- React Router owns shell navigation, route boundaries, and local server routes.
- Runtime local AI may perform characters, judge exchanges, summarize memories, and phrase content only after deterministic game systems choose the trigger, subject, allowed context, choices, and effects.
- LLM outputs must be validated before they affect state.
- Vector retrieval and scoped memory tool calls are context selection tools, not sources of truth.
- Memory visibility rules must be enforced in application code before prompt assembly or tool result return.
- Never use `any` or `as any`. Keep types explicit and narrow. Prefer inline interfaces and types unless reused.

## Playwright Testing

- Browser automation is the primary fast regression surface for gameplay and UI work.
- Assume the dev server is already running at `http://localhost:5173/` when using Playwright.
- If the required dev server is not running, stop and ask the user to start it.
- Never start dev servers autonomously for Playwright work.
- Treat Playwright as a single-owner shared resource by default.
- Do not run concurrent Playwright sessions or parallel Playwright agents unless the user explicitly asks for that coordination and the active owner releases the browser first.
- Always close the Playwright session when finished so other agents can open their own.
- Store Playwright artifacts under `playwright/`, never in the repo root.
- Put screenshots in `playwright/screenshots/`.
- Put logs and network captures in `playwright/logs/`.
- Put traces and other browser artifacts in `playwright/artifacts/`.
- If a Playwright tool accepts a filename, always target those folders explicitly.

## Documentation

- Code, tests, fixtures, and assets are the source of truth for implemented product behavior.
- `docs/agent-implementation-plan.md` owns implementation order, blockers, task status, and acceptance criteria.
- `docs/world/visual-design.md` owns frontend design and theme (Aura interface direction and Tailwind tokens).
- `docs/world/image-style.md` owns image asset style, portrait generation prompts, the cutout pipeline, and asset acceptance checks.
- `docs/world/voice.md` owns voice, tone, prose mechanics, comedic engine, and member voice fingerprints.
- Future world docs should own remaining concerns: lore, naming, and content feel.
- Update task status in the implementation plan when starting or finishing planned work.

## Copy Style

- Never use em dashes or en dashes anywhere. This applies to code comments, docs, plans, commit messages, runtime copy, and chat output. Use commas, periods, colons, parentheses, or separate sentences.
- Do not substitute two hyphens for a dash.
- Avoid AI-slop patterns: "delve", "in essence", "moreover", "it is worth noting", "navigating", "tapestry", "intricate", "myriad", "plethora", "unleash", "leverage" or "harness" used as verbs, "elevate", filler uses of "robust", hedging stacks like "perhaps could potentially", and "not just X but also Y" constructions.
- User-facing copy should follow IDC's tone: workplace comedy under supernatural pressure. Professional, slightly dry, and frequently absurd.
- Death and serious-injury copy is never funny.
- Write in active voice. Cut adverbs that do not change meaning. Trust the reader.

## AI And Assets

- Runtime local AI is required for player-facing date simulation. The playable game should not provide a non-AI date mode.
- Deterministic fixture paths exist for service tests and smoke coverage, not as a player-facing substitute for Ollama.
- Runtime local AI must stay bounded by schemas, deterministic context retrieval, memory visibility, and validated state updates.
- Production-time AI asset work is separate from runtime AI. Engineering and content agents may generate or revise assets while executing plans, but generated assets should be checked in only after human approval.
- Generate v1 member portraits against a white background.
- Follow the webtoon/manhua portrait direction in `docs/world/image-style.md`.
- Use `scripts/portraits/remove_background.py` with `bria-rmbg` for approved portrait cutouts.
- Tool-assisted background removal is a final post-approval asset step for cutout images. Do not use it for full backdrops or unique portrait cards.

## UI Rules

- Use Tailwind v4 utilities through `className`.
- Do not use inline CSS styles for UI work.
- Avoid new global CSS classes unless the active plan explicitly requires shared base styling.
- Enabled clickable UI elements must include `cursor-pointer`.
- Disabled controls must use `disabled:cursor-not-allowed` or an equivalent disabled-state cursor.
- Minimum font size is `text-xs` or 12px. Never use smaller arbitrary text.
- Desktop-first. Do not spend effort on mobile, but keep the UI responsive across desktop sizes.
- Preserve the implemented operations dashboard feel in `app/app.css`, `app/components/`, and `docs/world/visual-design.md`.
- Preserve the Aura design language described in `app/app.css` and `docs/world/visual-design.md`.
- Do not create a marketing landing page for the playable game shell.

## Verification

- Run `vp check` after code changes.
- Run `vp test` and `vp build` when a change touches runtime behavior, saves, systems, fixtures, integration, or user-facing workflows.
- For docs-only changes, review relevant links and cross-doc references.
- Fix failing checks instead of dismissing them as unrelated unless the user says there is parallel work.

## Vite Plus

This project uses Vite Plus, a unified toolchain built on Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite Plus uses the global `vp` CLI. Vite Plus is distinct from regular Vite and invokes Vite through `vp dev` and `vp build`.

Local docs are in `node_modules/vite-plus/docs`. Online docs are at `https://viteplus.dev/guide/`.

Review checklist:

- Run `vp install` after pulling remote changes and before starting work.
- Run `vp check` and `vp test` to format, lint, type check, and test changes.
- Check `vite.config.ts` tasks and `package.json` scripts for validation commands. Run project scripts through `vp run` when needed.
