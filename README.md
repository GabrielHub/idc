# Interdimensional Dating Coach (IDC)

You work at Cupid, the agency that books dates between hopefuls from across realities. IDC is a local-first management sim where deterministic TypeScript services own gameplay, while runtime LLMs perform the characters, judge each exchange, file player-facing reads, and write the memories that build up over time. A vector-indexed memory layer drives scoped RAG into every prompt, and every LLM output is parsed against a Zod schema before it can touch state.

The app ships as a React Router 7 SPA and as a Tauri 2 desktop shell over the same SPA.

## Install (alpha)

Player install instructions live in [docs/desktop-install-guide.md](docs/desktop-install-guide.md). You will need either a local Ollama install or a Vercel AI Gateway key.

## Stack

React 19, React Router 7, TypeScript, Tailwind v4, Zod, AI SDK with `ai-sdk-ollama` and the native Vercel AI Gateway provider from `ai`, Tauri 2, Vitest. The toolchain is Vite Plus (`vp`) on top of Vite, Rolldown, Vitest, Oxlint, Oxfmt, and Vite Task.

## Prerequisites

- Node 20+ and `pnpm` 10
- Vite Plus CLI: `npm i -g vite-plus`
- Rust and the Tauri 2 platform prerequisites for desktop work
- GitHub CLI (`gh`) for publishing test releases
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

## Releases

`vp run tauri:build` is the release gate for desktop packaging because it includes `vp check`, type generation, TypeScript, tests, desktop bundle verification, and Tauri packaging. The full friend-share release flow (versioning, checksums, GitHub prerelease) is in [docs/release-checklist.md](docs/release-checklist.md).

## Documentation

- [Desktop install guide](docs/desktop-install-guide.md): private alpha install flow, provider setup, save locations, caveats.
- [Release checklist](docs/release-checklist.md): friend-share prerelease flow.
- [Visual design](docs/world/visual-design.md): Aura interface direction and Tailwind tokens.
- [Image style](docs/world/image-style.md): portrait style, prompt construction, cutout pipeline.
- [Voice](docs/world/voice.md): tone, prose mechanics, and member voice fingerprints.
- [Gameplay traits](docs/world/gameplay-traits.md): hidden match tags, player knowledge, filed reads, hard stops.
- [Agent instructions](AGENTS.md): architecture rules, toolchain conventions, copy style, UI rules.
