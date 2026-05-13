# Interdimensional Dating Coach (IDC)

You work at Cupid, the agency that books dates between hopefuls from across realities. IDC is a local-first management sim where deterministic TypeScript services own gameplay, while runtime LLMs perform the characters, judge each exchange, file player-facing reads, and write the memories that build up over time. A vector-indexed memory layer drives scoped RAG into every prompt, and every LLM output is parsed against a Zod schema before it can touch state.

The app ships as a React Router 7 SPA and as a Tauri 2 desktop shell over the same SPA.

## Install (alpha)

Player install instructions live in [docs/support/desktop-install-guide.md](docs/support/desktop-install-guide.md). You will need either a local Ollama install or a Vercel AI Gateway key.

## Stack

React 19, React Router 7, TypeScript, Tailwind v4, Zod, AI SDK with `ai-sdk-ollama` and the native Vercel AI Gateway provider from `ai`, Tauri 2, Vitest. The toolchain is Vite Plus (`vp`) on top of Vite, Rolldown, Vitest, Oxlint, Oxfmt, and Vite Task.

## Prerequisites

- Node 20+ and `pnpm` 10
- Vite Plus CLI: `npm i -g vite-plus`
- Rust and the Tauri 2 platform prerequisites for desktop work
- GitHub CLI (`gh`) for publishing test releases
- The Tauri updater signing private key when packaging a release
- One AI provider for playable dates:
  - Ollama running locally with a chat model and `embeddinggemma`, or
  - A Vercel AI Gateway key entered in the app
- Python 3 with `bria-rmbg` only if you run the portrait cutout script

## Quick Start

```bash
vp install
vp dev
```

Open `http://localhost:5173/`. First run starts at the splash screen, creates the save when you punch in, then routes you through AI setup before Cupid can book a date.

If your local Ollama rejects the dev origin, configure Ollama CORS for `http://localhost:5173`. Desktop builds route Ollama through Tauri's HTTP scope and don't need this.

## Common Commands

| Command                          | Purpose                                                        |
| -------------------------------- | -------------------------------------------------------------- |
| `vp install`                     | Install dependencies. Run after pulling changes.               |
| `vp dev`                         | Start the browser SPA dev server at `http://localhost:5173/`.  |
| `vp check`                       | Format, lint, and type check.                                  |
| `vp test`                        | Run Vitest.                                                    |
| `vp build`                       | Build the browser SPA.                                         |
| `vp preview`                     | Preview the latest browser production build.                   |
| `vp run build:desktop`           | Build the desktop-mode SPA bundle and run the verifier.        |
| `vp run tauri:dev`               | Open the Tauri desktop shell for local development.            |
| `vp run tauri:build`             | Full release gate: check, typegen, tsc, test, verify, package. |
| `vp run updater:manifest`        | Write `latest.json` for the Tauri desktop updater.             |
| `vp run portrait:cutout`         | Run portrait background removal.                               |
| `vp run portrait:resize-avatars` | Normalize portrait avatar crops.                               |

Use `vp` first. Run other project scripts through `vp run` when there is no dedicated `vp` command.

Playwright is the primary UI regression surface. Assume the dev server is already running at `http://localhost:5173/`. Store screenshots in `playwright/screenshots/`, logs in `playwright/logs/`, and traces in `playwright/artifacts/`.

## AI Setup

AI setup runs in app, not in a server route. The setup panel lets the player choose:

- Ollama on this PC. Default URL is `http://127.0.0.1:11434`, default chat model is `gemma4:e4b`, and default embedding model is `embeddinggemma`. The catalog ships heavier and lighter alternatives for different VRAM tiers.
- Vercel AI Gateway. Default URL is `https://ai-gateway.vercel.sh/v3/ai`, default chat model is `deepseek/deepseek-v4-flash`, and default embedding model is `google/gemini-embedding-2`.

The implementation uses AI SDK v6 `createGateway` from `ai` for Vercel AI Gateway. The old OpenAI-compatible provider path is only supported as a saved default URL migration.

There is no `AI_GATEWAY_API_KEY` fallback. Gateway keys are entered by the player and passed explicitly to `createGateway`, then stored outside the game save. Browser builds use a localStorage key. Desktop builds use `secrets/gateway-api-key.txt` under the Tauri app local data directory and migrate any older browser-storage key into that file.

Desktop builds lock provider base URLs to the Tauri HTTP scope: localhost Ollama and the default Vercel AI Gateway URL. Custom provider hosts need a build with an updated desktop scope.

## Saves

Saves go through an async raw save-store boundary. Browser builds use localStorage. Desktop builds use files under the app local data directory:

- Windows: `%LOCALAPPDATA%\dev.idc.cupid\saves\`
- macOS: `~/Library/Application Support/dev.idc.cupid/saves/`

## Project Layout

```text
app/
  components/       Cupid shell, canvas rooms (Live Date, Roster, Date Book, Files), splash, AI setup, shared UI
  domain/           Zod schemas and TypeScript game contracts
  fixtures/         Static members, scenarios, goals, and starter content
  platform/         Runtime detection and desktop URL policy
  repositories/     Raw save stores and LocalGameRepository
  routes/           SPA route modules
  services/         Game systems, AI date engine, prompts, memory, vector search
    ai/             Provider catalog, model service, fetch transport, AI client helpers
docs/
  product/          Voice, visual design, image style, gameplay traits
  workflows/        Repeatable authoring, release, and engineering procedures
  support/          Player and operator support guides
scripts/
  portraits/        Portrait processing scripts
src-tauri/          Tauri shell, capabilities, icons, and Rust commands
public/assets/      Shipped portraits and client assets
assets-source/      Source portrait inputs, never shipped to the client
```

A Vite plugin fails the build if portrait source files land under `public/assets/portraits/source/`. Keep source images under `assets-source/portraits/<member-id>/`.

## Releases

`.github/workflows/release-desktop.yml` is the normal desktop release path. It runs from pushed `v*` tags or manual dispatch, builds the Windows installer, signs updater artifacts from GitHub secrets, creates the versioned prerelease, uploads the player README and package assets, and refreshes the `desktop-alpha` updater channel.

`vp run tauri:build` remains the local release gate for desktop packaging because it includes `vp check`, type generation, TypeScript, tests, desktop bundle verification, and Tauri packaging. Local release builds need `TAURI_SIGNING_PRIVATE_KEY` set to the updater private key path or contents so the updater artifacts are signed.

Desktop updates use Tauri's signed static JSON updater pattern. The app checks:

```text
https://github.com/GabrielHub/idc/releases/download/desktop-alpha/latest.json
```

Each versioned GitHub prerelease owns the installer, checksum, `.sig`, and a copy of `latest.json`. The fixed `desktop-alpha` GitHub release owns the active updater channel by replacing only `latest.json`.

Installed desktop builds check for updates once after launch and expose a manual Settings, Updates check. If a signed update is available, the settings button shows an Update badge. Installation always waits for the player to choose Install.

Renderer failures show a crash report screen with Copy report, reload actions, and Show log folder on desktop builds. Rust panics from the Tauri shell are written to the same rolling desktop log file so playtest reports can include both sides of the app.

Do not regenerate the updater private key for normal releases. Installed apps trust the public key in `src-tauri/tauri.conf.json`, so key rotation requires shipping a build that trusts the new public key before publishing packages signed by that key. The full friend-share release flow is in [docs/workflows/release-checklist.md](docs/workflows/release-checklist.md).

## Documentation

- [Docs index](docs/README.md): documentation map and ownership rules.
- [Desktop install guide](docs/support/desktop-install-guide.md): private alpha install flow, provider setup, save locations, caveats.
- [Release README](docs/support/release-readme.md): short install notes for player-facing GitHub release assets.
- [Release checklist](docs/workflows/release-checklist.md): friend-share prerelease flow.
- [Add member workflow](docs/workflows/add-member.md): content checklist for one new member.
- [Add date scenario workflow](docs/workflows/add-date-scenario.md): content checklist for one new date scenario.
- [Visual asset iteration](docs/workflows/visual-asset-iteration.md): independent image workflow for portraits, variants, and backgrounds.
- [Visual design](docs/product/visual-design.md): Aura interface direction and Tailwind tokens.
- [Image style](docs/product/image-style.md): portrait style, prompt construction, cutout pipeline.
- [Voice](docs/product/voice.md): tone, prose mechanics, and member voice fingerprints.
- [Gameplay traits](docs/product/gameplay-traits.md): hidden match tags, player knowledge, filed reads, hard stops.
- [Agent instructions](AGENTS.md): architecture rules, toolchain conventions, copy style, UI rules.
