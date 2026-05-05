# IDC

A local-first relationship operations dashboard for Cupid. The app pairs members with scenarios, runs date sessions through a deterministic game engine, and uses a local LLM to perform characters, judge exchanges, and summarize memories within schema-validated bounds.

## Stack

- React Router 7 (SSR) on Node
- React 19, TypeScript, Tailwind v4
- Zod for domain schemas and runtime validation
- Vitest for unit and smoke tests
- Vite Plus (`vp`) toolchain on top of Vite, Rolldown, Vitest, Oxlint, Oxfmt
- Local AI through `ai-sdk-ollama` and `@ai-sdk/openai-compatible`, defaulting to Ollama at `http://127.0.0.1:11434`

## Prerequisites

- Node 20+ and `pnpm` 10 (declared in `package.json`)
- The `vp` CLI installed globally (`npm i -g vite-plus`)
- Ollama running locally is required to book and run dates. Pull the models referenced by `app/services/ai/ollama-provider.server.ts` before invoking date flows. This is intentional: the playable game has no non-AI date mode. The roster and brief can still load when local AI is unavailable.
- Python 3 with `bria-rmbg` available if you run the portrait cutout script.

## Quick start

```bash
vp install
vp dev
```

The dev server listens on `http://localhost:5173/`. The dashboard at `/` is the only user-facing route; `/api/game` is the server action endpoint used by the dashboard for AI-backed date turns.

## Common commands

| Command                  | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `vp install`             | Install dependencies. Run after pulling.      |
| `vp dev`                 | Start the dev server with HMR.                |
| `vp check`               | Format, lint, and type check.                 |
| `vp test`                | Run Vitest.                                   |
| `vp build`               | Production build to `build/`.                 |
| `vp preview`             | Serve the production build locally.           |
| `vp run portrait:cutout` | Run the portrait background-removal pipeline. |

Fall back to `pnpm` scripts (`pnpm build`, `pnpm start`, `pnpm typecheck`) only where there is no `vp` equivalent.

## Project layout

```
app/
  domain/           Zod schemas and TypeScript types for game state
  fixtures/         Static gameplay data (members, scenarios, goals)
  services/         Game engine, AI date engine, prompts, memory, vector search
    ai/             Ollama and OpenAI-compatible provider wrappers
  repositories/     Persistence (browser localStorage, Node JSON storage)
  routes/           React Router routes (home dashboard, game API)
  components/       UI components, including the main dashboard
docs/
  world/            Voice, visual design, image style
scripts/portraits/  Python asset pipeline (background removal)
public/assets/      Shipped portrait folders
assets-source/      Source portrait folders, never shipped to the client
```

A Vite plugin in `vite.config.ts` fails the build if portrait sources land under `public/assets/portraits/source/`. Source images belong in `assets-source/portraits/<member-id>/`.

## Architecture

The system splits gameplay authority from generative content. Read `AGENTS.md` for the full set of rules; the short version:

- **App-owned state is canonical.** The deterministic game engine in `app/services/date-engine.ts` decides triggers, subjects, allowed context, choices, and effects.
- **Domain types own contracts.** Every save, message, judge snapshot, and memory record is parsed through a Zod schema in `app/domain/game.ts` before it touches state.
- **Repositories own persistence.** `LocalGameRepository` reads and writes through a `KeyValueStorage` driver. The browser uses `localStorage`; the server route uses `NodeJsonStorageDriver`. Repositories do not repair gameplay.
- **Local AI is bounded.** `app/services/ai-date-engine.server.ts` performs characters, judges exchanges, and summarizes memories only after the deterministic engine selects the moment. LLM outputs are validated against domain schemas before they update state.
- **Date play is gated by local AI.** The dashboard probes `/api/game?intent=local-ai-status` on load and retries that probe before booking. If the local models are unavailable, roster and brief stay visible but date booking is blocked with a visible error state. Deterministic date paths exist for service tests and smoke coverage, not as a player-facing fallback.
- **Implemented behavior lives in code.** Domain schemas, fixtures, game services, repositories, UI components, tests, and checked assets are the source of truth for current gameplay. Docs explain intent and workflows, but no separate planning document owns product behavior.
- **Memory retrieval is context selection, not truth.** Vector search in `app/services/cupid-memory.ts` and `app/services/vector-memory.ts` produces candidates; visibility rules are enforced before a candidate reaches a prompt or tool result.

## Testing

Vitest is the primary regression surface for engine and AI flows:

- `app/services/game-smoke.test.ts` exercises a full deterministic shift: starter fixtures, date sessions, follow-up actions, and shift completion.
- `app/services/ai-date-engine.server.test.ts` and `app/services/ai/ollama-provider.server.test.ts` cover AI date orchestration and provider plumbing.

Playwright is the fast UI regression surface. The dev server must already be running at `http://localhost:5173/` before invoking Playwright; agents should not start it autonomously. Artifacts go under `playwright/screenshots/`, `playwright/logs/`, and `playwright/artifacts/`.

Run `vp check` after every code change. Run `vp test` and `vp build` for changes that touch runtime behavior, saves, systems, fixtures, integration, or user-facing workflows.

## Asset pipeline

Member portraits live in per-member folders. Runtime cutouts use `public/assets/portraits/<member-id>/portrait.png` for the full body and `public/assets/portraits/<member-id>/avatar.png` for the upper half. Source images mirror that shape under `assets-source/portraits/<member-id>/`.

1. Generate a portrait against a plain white background. See `docs/world/image-style.md` for prompt construction and acceptance criteria.
2. Place the source under `assets-source/portraits/<member-id>/portrait.png` or `assets-source/portraits/<member-id>/avatar.png`. The Vite plugin will fail the build if a source file leaks into `public/`.
3. After human approval, run `vp run portrait:cutout --input assets-source/portraits/<member-id> --output public/assets/portraits/<member-id> --overwrite` to produce the cutouts.

## Production build

```bash
vp build
pnpm start
```

`pnpm start` runs `react-router-serve` against `build/server/index.js`. The build emits:

```
build/
  client/   Static assets
  server/   Server-side bundle
```

Any Node-capable host works. Containerization is out of scope for this repo.

## Documentation

- [Visual design](docs/world/visual-design.md): Aura interface direction, Tailwind tokens.
- [Image style](docs/world/image-style.md): portrait style, prompt construction, cutout pipeline.
- [Voice](docs/world/voice.md): voice registers, prose mechanics, member fingerprints.
- [Agent instructions](AGENTS.md): architecture rules, toolchain conventions, copy style, UI rules.
