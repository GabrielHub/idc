# IDC: Cupid

IDC: Cupid is a local-first relationship operations game. The app books dates between hopefuls from across realities, runs each date through deterministic game services, and uses a required AI provider to perform characters, judge exchanges, and summarize memories inside schema-validated bounds.

The current app ships as a React Router SPA and as a Tauri desktop shell over the same SPA. There is no Node gameplay server in the normal run path.

## Current Shape

- React Router 7 SPA with `ssr: false` and `/` prerendered.
- Browser development runs through Vite Plus at `http://localhost:5173/`.
- Desktop development and packaging run through Tauri 2, using the SPA bundle under `build/client`.
- The browser dev shell includes `/playground`; desktop mode excludes it.
- Runtime AI is required for player-facing dates. Ollama and Vercel AI Gateway are the supported providers.
- `/api/game` has been removed. The dashboard calls TypeScript services directly for AI readiness, date advancement, streaming events, and completion.
- Saves go through an async raw save-store boundary. Browser builds use localStorage. Desktop builds use files under the app local data directory.

## Stack

- React 19, React Router 7, TypeScript
- Tailwind v4 through Vite
- Zod for domain schemas and runtime validation
- AI SDK with `ai-sdk-ollama` and `@ai-sdk/openai-compatible`
- Tauri 2 with scoped filesystem and HTTP plugins
- Vitest for service, domain, and smoke coverage
- Vite Plus (`vp`) on top of Vite, Rolldown, Vitest, Oxlint, Oxfmt, and Vite Task

## Prerequisites

- Node 20+ and `pnpm` 10, as declared in `package.json`.
- The global Vite Plus CLI: `npm i -g vite-plus`.
- Rust and the Tauri 2 platform prerequisites when running or packaging the desktop app.
- One AI provider for playable dates:
  - Ollama running locally with a chat model and `embeddinggemma`.
  - A Vercel AI Gateway key entered in the app.
- Python 3 with `bria-rmbg` only if you run the portrait cutout script.

## Quick Start

```bash
vp install
vp dev
```

Open `http://localhost:5173/`. First run starts at the splash screen, creates the save when you punch in, then routes you through AI setup before Cupid can book a date.

Browser Ollama requests are normal browser fetches. If your local Ollama rejects the dev origin, configure Ollama CORS for `http://localhost:5173`. The desktop build does not need `OLLAMA_ORIGINS` because Tauri handles local Ollama calls through the scoped desktop HTTP path.

## Tauri Desktop Flow

```bash
vp run tauri:dev
```

Tauri runs `vp dev` from `src-tauri/tauri.conf.json` and opens the desktop window against `http://localhost:5173`.

```bash
vp run tauri:build
```

Tauri runs the desktop SPA build first:

```bash
vp exec react-router build --mode desktop
vp node scripts/verify-desktop-build.mjs
```

Then it packages the app. The desktop verifier requires `build/client/index.html` and `build/client/__spa-fallback.html`, and fails if the desktop bundle contains API route artifacts, playground route artifacts, `.server` chunks, or `AI_GATEWAY_API_KEY`.

The install guide for private alpha builds is in [docs/desktop-install-guide.md](docs/desktop-install-guide.md).

## Common Commands

| Command                                     | Purpose                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `vp install`                                | Install dependencies. Run after pulling changes.                   |
| `vp dev`                                    | Start the browser SPA dev server at `http://localhost:5173/`.      |
| `vp check`                                  | Format, lint, and type check.                                      |
| `vp test`                                   | Run Vitest.                                                        |
| `vp build`                                  | Build the browser SPA.                                             |
| `vp preview`                                | Preview the latest browser production build.                       |
| `vp exec react-router build --mode desktop` | Build the desktop-mode SPA bundle.                                 |
| `vp node scripts/verify-desktop-build.mjs`  | Inspect the desktop bundle for forbidden server and dev artifacts. |
| `vp run build:desktop`                      | Shortcut for the desktop SPA build plus verifier.                  |
| `vp run tauri:dev`                          | Open the Tauri desktop shell for local development.                |
| `vp run tauri:build`                        | Build Tauri installers or app bundles.                             |
| `vp run portrait:cutout`                    | Run portrait background removal.                                   |
| `vp run portrait:resize-avatars`            | Normalize portrait avatar crops.                                   |

Use `vp` first. Run project scripts through `vp run` when there is no dedicated `vp` command.

## AI Setup

AI setup is in app, not in a server route.

The setup panel lets the player choose:

- Ollama on this PC. Default URL is `http://127.0.0.1:11434`, default chat model is `gemma4:e4b`, and default embedding model is `embeddinggemma`. The catalog ships heavier and lighter alternatives for different VRAM tiers.
- Vercel AI Gateway. Default Gateway URL is `https://ai-gateway.vercel.sh/v1`, default chat model is `deepseek/deepseek-v4-flash`, and default embedding model is `google/gemini-embedding-2`.

The current readiness path is:

1. Splash screen or dashboard loads the save through `createGameRepository()`.
2. `requestLocalAiStatus()` calls `checkAiReadiness()` directly from `app/services/ai/model-service.ts`.
3. Date actions call `advanceDateExchangeWithLocalAiStream()` and `completeDateSessionWithLocalAiStream()` directly from `app/services/ai-date-engine.ts`.
4. Streams update the UI as service events arrive.

There is no `AI_GATEWAY_API_KEY` fallback. Gateway keys are entered by the player and stored outside the game save through `app/services/ai/client.ts` using the `idc.cupid.aiGatewayKey` browser storage key. The game save stores provider choice, model IDs, base URLs, and `aiSetupComplete`, but not the Gateway key.

Desktop builds lock provider base URLs to the Tauri HTTP scope: localhost Ollama and the default Vercel AI Gateway URL. Custom provider hosts need a build with an updated desktop scope.

## Removal Of `/api/game`

The old `/api/game` route is gone. Do not add new gameplay through React Router API routes.

Current route config lives in [app/routes.ts](app/routes.ts):

- `/` loads [app/routes/home.tsx](app/routes/home.tsx).
- `/playground` is available only outside desktop mode.
- No app-owned `/api/*` route is registered.

The app still talks to provider APIs. Ollama has its own local `/api/tags`, `/api/ps`, and generation endpoints, but those are provider URLs, not React Router routes.

## Save Store Architecture

Persistence now has three layers:

1. `RawSaveStore` in [app/repositories/raw-save-store.ts](app/repositories/raw-save-store.ts) owns async raw text reads, writes, and deletes.
2. `LocalGameRepository` in [app/repositories/local-game-repository.ts](app/repositories/local-game-repository.ts) owns save parsing, Zod validation, schema migration, fixture hydration, legacy save key migration, serialization, and repository methods.
3. `createGameRepository()` in [app/repositories/create-game-repository.ts](app/repositories/create-game-repository.ts) selects the runtime store.

Store implementations:

- [BrowserLocalStorageSaveStore](app/repositories/browser-local-storage-save-store.ts) for browser dev and browser preview.
- [TauriAppLocalDataSaveStore](app/repositories/tauri-app-local-data-save-store.ts) for desktop file saves under `saves/<safe-key>.json` in the app local data directory.
- [MemorySaveStore](app/repositories/memory-save-store.ts) for tests and non-browser fallback.

The repository owns save validity. Gameplay consequences still belong in services, not in persistence.

Desktop save locations:

- Windows: `%LOCALAPPDATA%\dev.idc.cupid\saves\`
- macOS: `~/Library/Application Support/dev.idc.cupid/saves/`

## Project Layout

```text
app/
  components/       Dashboard, splash, AI setup, and shared UI pieces
  domain/           Zod schemas and TypeScript game contracts
  fixtures/         Static members, scenarios, goals, and starter content
  platform/         Runtime detection and desktop URL policy
  repositories/     Raw save stores and LocalGameRepository
  routes/           SPA route modules
  services/         Game systems, AI date engine, prompts, memory, vector search
    ai/             Provider catalog, model service, fetch transport, AI client helpers
docs/
  world/            Voice, visual design, image style, gameplay traits
scripts/
  portraits/        Portrait processing scripts
src-tauri/          Tauri shell, capabilities, icons, and Rust commands
public/assets/      Shipped portraits and client assets
assets-source/      Source portrait inputs, never shipped to the client
```

A Vite plugin fails the build if portrait source files land under `public/assets/portraits/source/`. Keep source images under `assets-source/portraits/<member-id>/`.

## Architecture Notes

- App-owned canonical state is authoritative for gameplay.
- Domain schemas own contracts.
- Fixtures own static gameplay definitions.
- Game services own consequences.
- Runtime AI performs characters, judges exchanges, summarizes memories, and embeds memory text only after deterministic services choose the trigger, subject, allowed context, choices, and effects.
- LLM outputs are parsed and validated before they update state.
- Memory retrieval selects context. Visibility rules are enforced in application code before memories reach prompts or tool results.
- Tauri owns the native shell, scoped filesystem access, and scoped HTTP access. Rust does not own gameplay.

## Testing And Verification

Vitest covers deterministic engine behavior, save migration, AI provider plumbing, prompt assembly, fetch transport, and smoke flows:

```bash
vp check
vp test
```

Run `vp build` when changes affect runtime behavior, saves, systems, fixtures, integration, or user-facing workflows.

For desktop packaging checks:

```bash
vp exec react-router build --mode desktop
vp node scripts/verify-desktop-build.mjs
vp run tauri:build
```

Playwright is the primary UI regression surface. The dev server should already be running at `http://localhost:5173/` before Playwright work starts. Store screenshots in `playwright/screenshots/`, logs in `playwright/logs/`, and traces or other browser artifacts in `playwright/artifacts/`.

## Asset Pipeline

Member portraits live in per-member folders. Runtime cutouts use `public/assets/portraits/<member-id>/portrait.png` for the full body and `public/assets/portraits/<member-id>/avatar.png` for the upper half. Source images mirror that shape under `assets-source/portraits/<member-id>/`.

1. Generate a portrait against a plain white background. See [docs/world/image-style.md](docs/world/image-style.md) for prompt construction and acceptance checks.
2. Place the approved source under `assets-source/portraits/<member-id>/portrait.png` or `assets-source/portraits/<member-id>/avatar.png`.
3. Run the cutout pipeline:

```bash
vp run portrait:cutout --input assets-source/portraits/<member-id> --output public/assets/portraits/<member-id> --overwrite
```

## Documentation

- [Desktop install guide](docs/desktop-install-guide.md): private alpha install flow, provider setup, save locations, caveats.
- [Visual design](docs/world/visual-design.md): Aura interface direction and Tailwind tokens.
- [Image style](docs/world/image-style.md): portrait style, prompt construction, cutout pipeline.
- [Voice](docs/world/voice.md): tone, prose mechanics, and member voice fingerprints.
- [Gameplay traits](docs/world/gameplay-traits.md): hidden match tags, visible dealbreakers, hard stops.
- [Agent instructions](AGENTS.md): architecture rules, toolchain conventions, copy style, UI rules.
