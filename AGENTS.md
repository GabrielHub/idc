# Agent Instructions

Keep this file limited to durable project facts. For task-specific behavior, read the relevant code, tests, fixtures, and TSX docs before changing files.

## Agent Autonomy

- Challenge requests that conflict with product docs, architecture, or current implementation evidence.
- Be critical. Push back when a request creates scope drift, weak architecture, or brittle gameplay behavior.
- Avoid sprawl. Prefer existing patterns, shared domain types, and reusable game services over duplicate functions or components.

## Source Of Truth

- Code, tests, fixtures, and assets are authoritative for implemented behavior.
- Product, gameplay, workflow, support, and roadmap docs live as TSX under `app/docs/` and render at `/docs`.
- The docs registry and routes live in `app/services/docs-content.ts`, `app/routes/docs.tsx`, and `app/routes/docs.$.tsx`.
- Before implementing from a roadmap plan, read its TSX file and verify `plan.status`. Do not implement a plan while it is `drafting`.
- Keep roadmap plan metadata current when work starts, completes, blocks, or moves to review.

## Toolchain

- Use Vite Plus first: `vp install`, `vp dev`, `vp check`, `vp test`, `vp build`, and `vp preview`.
- Use package scripts only where there is no `vp` equivalent.
- Run project scripts through Vite Plus when possible, for example `vp run portrait:cutout`.

## Architecture

- App-owned canonical state is authoritative for gameplay.
- Domain types and schemas own contracts.
- Fixtures own static gameplay definitions.
- Game services own gameplay consequences.
- Repositories and save code own persistence, serialization, and migration. They do not repair gameplay.
- UI owns presentation and typed user intents.
- React Router owns shell navigation, route boundaries, and local server routes.
- Runtime AI providers may perform characters, judge exchanges, summarize memories, and phrase content inside app prompts, schemas, memory visibility rules, numeric bounds, and deterministic context selection.
- Validated LLM outputs may influence gameplay state. Game services apply, clamp, overlay, reject, and persist those outputs.
- Deterministic systems choose date frames, eligible context, match fit overlays, hard stops, and persistence boundaries.
- Never use `any` or `as any`. Keep types explicit and narrow. Prefer inline interfaces and types unless reused.

## Randomness

- Do not call `Math.random` in app code.
- Use typed RNG helpers in `app/services/utils.ts`: `createNamespacedRandom`, `createSeededRandom`, `randomIndex`, `shuffleInPlace`, and `shuffledBySeed`.
- Gameplay randomness must be seedable and domain-namespaced.
- Preserve `random?: RandomFn` injection on service boundaries that need exact tests.

## AI And Assets

- Runtime AI through Ollama or Vercel AI Gateway is required for player-facing date simulation.
- Deterministic fixture paths exist for service tests and smoke coverage, not as a player-facing substitute.
- Runtime AI must stay bounded by schemas, deterministic context retrieval, memory visibility, and validated state updates.
- Production-time AI asset work is separate from runtime AI. Check in generated assets only after human approval.
- Member portraits use the webtoon and manhwa direction in `app/docs/product/image-style.tsx` and should be generated against a white background.
- Use `scripts/portraits/remove_background.py` with `bria-rmbg` only for approved portrait cutouts, not full backdrops or unique portrait cards.

## UI

- Use Tailwind v4 utilities through `className`.
- Do not use inline CSS styles for UI work.
- Avoid new global CSS classes unless the change needs shared base styling across multiple components.
- Enabled clickable UI elements must include `cursor-pointer`.
- Disabled controls must use `disabled:cursor-not-allowed` or an equivalent disabled-state cursor.
- Minimum font size is `text-sm` or 14px. Do not use Tailwind `text-xs`.
- Preserve the operations dashboard feel and Aura design language in `app/app.css`, `app/components/`, and `app/docs/product/visual-design.tsx`.
- Reuse existing components and patterns before adding new ones.

## Browser Testing

- Use browser automation for gameplay and UI regressions when behavior needs interactive or visual verification.
- Assume the dev server is already running at `http://localhost:5173/`. If it is not running, ask the user to start it.
- Do not start dev servers for browser testing work.
- Set browser viewports to `1920x1080`.
- Do not write browser artifacts, screenshots, traces, logs, or temporary test files into the repository root.

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
