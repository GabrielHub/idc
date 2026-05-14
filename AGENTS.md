# Agent Instructions

## Agent Autonomy

- Read relevant code, and `docs` before changing code. You must draw your knowledge from code instead of guessing
- Challenge requests that conflict with product docs, architecture, or current implementation evidence.
- Be critical. Push back when a request creates scope drift, weak architecture, or brittle gameplay behavior.
- Avoid sprawl. Prefer existing patterns, shared domain types, and reusable game services over duplicate functions or components.
- Always use the `frontend-skill` when creating or heavily refactoring UI components or screens.

## Toolchain

- Use Vite Plus first: `vp install`, `vp dev`, `vp check`, `vp test`, `vp build`, and `vp preview`.
- Use package scripts only where there is no `vp` equivalent.
- Run project scripts through Vite Plus when possible, for example `vp run portrait:cutout`.

## Architecture

- App-owned canonical state is authoritative for gameplay. Runtime AI providers never mutate state directly or own hidden facts, persistence, validation, or migration.
- Domain types and schemas own contracts.
- Fixtures own static gameplay definitions.
- Game services own gameplay consequences.
- Repositories and save code own persistence, serialization, and migration. They do not repair gameplay.
- UI owns presentation and typed user intents only.
- React Router owns shell navigation, route boundaries, and local server routes.
- Runtime AI providers may perform characters, judge exchanges, summarize memories, and phrase content within app prompts, schemas, memory visibility rules, numeric bounds, and deterministic context selection.
- Validated LLM outputs may influence gameplay state, including Date Health, pair stats, member mood, early endings, memories, and final reports. Game services apply, clamp, overlay, reject, and persist those outputs.
- Deterministic systems still choose the date frame, eligible context, match fit overlays, hard stops, and persistence boundaries.
- Never use `any` or `as any`. Keep types explicit and narrow. Prefer inline interfaces and types unless reused.

## Playwright Testing

- Browser automation is the primary fast regression surface for gameplay and UI work.
- Assume the dev server is already running at `http://localhost:5173/` when using Playwright.
- If the required dev server is not running, stop and ask the user to start it.
- Never start dev servers autonomously for Playwright work.
- Treat Playwright as a single-owner shared resource by default.
- Do not run concurrent Playwright sessions or parallel Playwright agents unless the user explicitly asks for that coordination and the active owner releases the browser first.
- Set every Playwright browser context or page viewport to `1920x1080` before testing, interacting with UI, or taking screenshots.
- Always close the Playwright session when finished so other agents can open their own.
- Closing a session means explicitly closing the page, context, browser, or MCP-backed Browser session with the available close command before the final response. Do not treat navigation away, a failed test, a stopped dev server, or the end of a turn as cleanup.
- After using Playwright MCP or the Browser plugin, verify that the session was closed. If a session cannot be closed through tool APIs, report the leaked `@playwright/mcp` process IDs instead of silently leaving them running.
- Store Playwright artifacts under `playwright/`
- Put screenshots in `playwright/screenshots/`.
- Put logs and network captures in `playwright/logs/`.
- Put traces and other browser artifacts in `playwright/artifacts/`.
- If a Playwright tool accepts a filename, always target those folders explicitly.

## Documentation

- Code, tests, fixtures, and assets are the source of truth for implemented product behavior.
- Documentation is authored as TSX under `app/docs/` and rendered at `/docs` in the dev shell. Read the TSX file directly when you need a doc as canonical context.
- Roadmap plans must be drafted in `app/docs/roadmap/*.tsx`, not as Markdown chat plans.
- Before implementing from a roadmap plan, read its TSX file and verify `plan.status`. Do not begin implementation while it is `drafting`; promote a scoped plan to `ready`, then move it to `in-flight` when code work starts.
- Keep roadmap plans current as work proceeds: set completed tasks' `defaultDone`, update `plan.done`, bump `plan.touched`, and move status to `review` when implementation is ready for audit or verification.
- Use `blocked` with `blockedReason` when work cannot continue, `shipped` only after acceptance and verification pass, and `shelved` only when the plan is intentionally abandoned.
- `app/docs/product/visual-design.tsx` owns Aura interface direction, Tailwind tokens, chat bubble schema, member auras, canvas layout, and scenario card system.
- `app/docs/product/image-style.tsx` owns image asset style, portrait generation prompts, the cutout pipeline, and asset acceptance checks.
- `app/docs/product/voice.tsx` owns voice, tone, prose mechanics, comedic engines, member voice fingerprints, event kinds, and closure summary voice.
- `app/docs/product/character-heights.tsx` owns member height canon, source-scale normalization, and the playground Height lineup workflow.
- `app/docs/gameplay/member-fields-and-tags.tsx` owns member fixture fields, hidden tag taxonomy, request tags, and authoring requirements.
- `app/docs/gameplay/player-knowledge.tsx` owns public/gated/never visibility tiers, filed reads, and retention secrecy.
- `app/docs/gameplay/match-fit.tsx` owns deterministic booking pressure, badge rules, and boundary risk.
- `app/docs/gameplay/pair-memory.tsx` owns pair state, agreements, open loops, and the hidden trajectory service.
- `app/docs/gameplay/case-management.tsx` owns focus cases, shift cadence, deck draws, closures, and win conditions.
- `app/docs/gameplay/roster-chemistry.tsx` owns warm clusters, friction zones, the four-anchor authoring pass, and the per-pair matrix.
- `app/docs/workflows/add-member.tsx` owns the repeatable checklist for adding a new member.
- `app/docs/workflows/add-date-scenario.tsx` owns the repeatable checklist for adding a new date scenario.
- `app/docs/workflows/visual-asset-iteration.tsx` owns independent member portrait, portrait variant, and scenario background generation.
- `app/docs/workflows/release-checklist.tsx` owns the friend-share desktop prerelease procedure.
- `app/docs/support/desktop-install-guide.tsx` and `app/docs/support/release-readme.tsx` own player and operator install copy.
- Doc primitives live in `app/components/doc-primitives.tsx`; the registry and routes live in `app/services/docs-content.ts`, `app/routes/docs.tsx`, and `app/routes/docs.$.tsx`.

## Copy Style

- Never use em dashes or en dashes anywhere. This applies to code comments, docs, plans, commit messages, runtime copy, and chat output. Use commas, periods, colons, parentheses, or separate sentences.
- Do not substitute two hyphens for a dash.
- Avoid AI-slop patterns: "delve", "in essence", "moreover", "it is worth noting", "navigating", "tapestry", "intricate", "myriad", "plethora", "unleash", "leverage" or "harness" used as verbs, "elevate", filler uses of "robust", hedging stacks like "perhaps could potentially", and "not just X but also Y" constructions.
- User-facing copy should follow IDC's tone: workplace comedy under supernatural pressure. Professional, slightly dry, and frequently absurd.
- Write in active voice. Cut adverbs that do not change meaning. Trust the reader.

## AI And Assets

- Runtime AI through Ollama or Vercel AI Gateway is required for player-facing date simulation. The playable game should not provide a non-AI date mode.
- Deterministic fixture paths exist for service tests and smoke coverage, not as a player-facing substitute for the required AI provider.
- Runtime AI must stay bounded by schemas, deterministic context retrieval, memory visibility, and validated state updates.
- Production-time AI asset work is separate from runtime AI. Engineering and content agents may generate or revise assets while executing plans, but generated assets should be checked in only after human approval.
- Generate member portraits against a white background.
- Follow the webtoon/manhwa portrait direction in `docs/product/image-style.md`.
- Use `scripts/portraits/remove_background.py` with `bria-rmbg` for approved portrait cutouts.
- Tool-assisted background removal is a final post-approval asset step for cutout images. Do not use it for full backdrops or unique portrait cards.

## UI Rules

- Use Tailwind v4 utilities through `className`.
- Do not use inline CSS styles for UI work.
- Avoid new global CSS classes unless the change needs shared base styling across multiple components.
- Enabled clickable UI elements must include `cursor-pointer`.
- Disabled controls must use `disabled:cursor-not-allowed` or an equivalent disabled-state cursor.
- Minimum font size is `text-xs` or 12px. Never use smaller arbitrary text.
- Desktop-first. Do not spend effort on mobile, but keep the UI responsive across desktop sizes.
- Preserve the implemented operations dashboard feel in `app/app.css`, `app/components/`, and `docs/product/visual-design.md`.
- Preserve the Aura design language described in `app/app.css` and `docs/product/visual-design.md`.
- Always check if a component or pattern already exists, reuse components when we can. If you find duplicate components, create a shared one and replace the duplicates

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
