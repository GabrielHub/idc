# Interdimensional Dating Coach (IDC)

You work at Cupid, the agency that books dates between hopefuls from across realities. IDC is a local-first management sim where deterministic TypeScript services own gameplay, while runtime LLMs perform the characters, judge each exchange, file player-facing reads, and write the memories that build up over time. A vector-indexed memory layer drives scoped RAG into every prompt, and every LLM output is parsed against a Zod schema before it can touch state.

The app ships as a React Router 7 SPA and as a Tauri 2 desktop shell over the same SPA.

## Install (alpha)

Player install instructions live in [app/docs/support/desktop-install-guide.tsx](app/docs/support/desktop-install-guide.tsx), rendered at `/docs/support/desktop-install-guide`. You will need either a local Ollama install or a Vercel AI Gateway key.

## Stack

React 19, React Router 7, TypeScript, Tailwind v4, Zod, AI SDK with `ai-sdk-ollama` and the native Vercel AI Gateway provider from `ai`, Tauri 2, Vitest. The toolchain is Vite Plus (`vp`) on top of Vite, Rolldown, Vitest, Oxlint, Oxfmt, and Vite Task.

## Prerequisites

- Node 20+ and `pnpm` 10
- Vite Plus CLI: `npm i -g vite-plus`
- Rust and the Tauri 2 platform prerequisites for desktop work
- GitHub CLI (`gh`) for publishing test releases
- The Tauri updater signing private key when packaging a release
- One AI route for playable dates:
  - Ollama running locally with a chat model and `embeddinggemma`, or
  - A Vercel AI Gateway key entered in the app
- Python 3 with `bria-rmbg` only if you run the portrait cutout script

## Quick Start

```bash
vp install
vp config
vp dev
```

Open `http://localhost:5173/`. First run starts at the splash screen, creates the save when you punch in, then routes you through AI setup before Cupid can book a date.

If your local Ollama rejects the dev origin, configure Ollama CORS for `http://localhost:5173`. Desktop builds route Ollama through Tauri's HTTP scope and don't need this.

## Common Commands

| Command                           | Purpose                                                        |
| --------------------------------- | -------------------------------------------------------------- |
| `vp install`                      | Install dependencies. Run after pulling changes.               |
| `vp config`                       | Install Vite Plus Git hooks for this clone.                    |
| `vp dev`                          | Start the browser SPA dev server at `http://localhost:5173/`.  |
| `vp check`                        | Format, lint, and type check.                                  |
| `vp test`                         | Run Vitest.                                                    |
| `vp build`                        | Build the browser SPA.                                         |
| `vp run verify`                   | Run the local gate used by pre-commit: check, test, and build. |
| `vp preview`                      | Preview the latest browser production build.                   |
| `vp run audit:dates`              | Run the AI-assisted date quality audit script.                 |
| `vp run build:desktop`            | Build the desktop-mode SPA bundle and run the verifier.        |
| `vp run release:check`            | Validate version, updater, release notes, and release assets.  |
| `vp run release:notes`            | Render GitHub or updater release notes from the catalog.       |
| `vp run tauri:dev`                | Open the Tauri desktop shell for local development.            |
| `vp run tauri:build`              | Full release gate: check, typegen, tsc, test, verify, package. |
| `vp run tune`                     | Run member voice tuning sessions from the local script.        |
| `vp run updater:manifest`         | Write `latest.json` for the Tauri desktop updater.             |
| `vp run portrait:cutout`          | Run portrait background removal.                               |
| `vp run portrait:resize-avatars`  | Normalize portrait avatar crops.                               |
| `vp run portrait:standee-footing` | Regenerate full-body standee footing metadata.                 |
| `vp run portrait:palettes`        | Regenerate full-body portrait palette metadata.                |

Use `vp` first. Run other project scripts through `vp run` when there is no dedicated `vp` command. Add future project workflows as Vite Plus tasks in `vite.config.ts` unless they are package lifecycle commands or need to stay as package manager scripts.

Playwright is the primary UI regression surface. Assume the dev server is already running at `http://localhost:5173/`. Store screenshots in `playwright/screenshots/`, logs in `playwright/logs/`, and traces in `playwright/artifacts/`.

## AI Setup

AI setup runs in app, not in a server route. The setup panel says "Pick where dates run. Cupid checks the connection before the first date." It lets the player choose:

- On this computer. Default Ollama URL is `http://127.0.0.1:11434`, default chat model is `gemma4:e4b`, and default embedding model is `embeddinggemma`. The catalog ships heavier and lighter alternatives for different VRAM tiers.
- Cloud. Default Gateway URL is `https://ai-gateway.vercel.sh/v3/ai`, default chat model is `deepseek/deepseek-v4-flash` with locked `xhigh` reasoning, and default embedding model is `openai/text-embedding-3-small`. Gateway selector cost labels come from `app/fixtures/gateway-model-costs.json`; refresh them with `vp run benchmark:gateway-costs`.

Gateway chat models are `deepseek/deepseek-v4-flash`, `deepseek/deepseek-v4-pro`, `google/gemini-3.1-flash-lite`, `anthropic/claude-haiku-4.5`, `moonshotai/kimi-k2.5`, `minimax/minimax-m2.7`, `alibaba/qwen3.5-flash`, `zai/glm-4.7-flash`, `openai/gpt-5.4-nano`, and `xiaomi/mimo-v2.5`. Gateway reasoning is locked per model: DeepSeek V4 Flash uses `xhigh`, DeepSeek V4 Pro uses `xhigh`, Gemini 3.1 Flash Lite uses `medium`, GPT 5.4 Nano uses `none`, MiMo V2.5 uses `xhigh`, and models without a stable Gateway reasoning control use `off`.

The primary setup action is `Save and connect`, which saves the draft config, checks readiness, then marks setup complete only after a ready check. Gateway can also check a pasted key or check the saved key without replacing it.

The implementation uses AI SDK v6 `createGateway` from `ai` for Vercel AI Gateway. The old OpenAI-compatible provider path is only supported as a saved default URL migration.

There is no `AI_GATEWAY_API_KEY` fallback. Gateway keys are entered by the player and passed explicitly to `createGateway`, then stored outside the game save. Browser builds use a localStorage key. Desktop builds use the OS credential store and migrate older desktop plaintext keys from `secrets/gateway-api-key.txt` into that store on first read.

Desktop builds lock provider base URLs to the Tauri HTTP scope: localhost Ollama and the default Vercel AI Gateway URL. Custom provider hosts need a build with an updated desktop scope.

## Saves

Saves go through an async raw save-store boundary. Browser builds use localStorage. Desktop builds use files under the app local data directory:

- Windows: `%LOCALAPPDATA%\dev.idc.cupid\saves\`
- macOS: `~/Library/Application Support/dev.idc.cupid/saves/`

## Project Layout

```text
app/
  components/       Cupid shell, canvas rooms (Live Date, Roster, Date Book, Files), splash, AI setup, shared UI, doc-primitives
  docs/             TSX field manual: roadmap, product, gameplay, workflows, support drawers
  domain/           Zod schemas and TypeScript game contracts
  fixtures/         Static members, scenarios, goals, and starter content
  platform/         Runtime detection and desktop URL policy
  repositories/     Raw save stores and LocalGameRepository
  routes/           SPA route modules (including docs.tsx and docs.$.tsx)
  services/         Game systems, AI date engine, prompts, memory, vector search, docs-content
    ai/             Provider catalog, model service, fetch transport, AI client helpers
scripts/
  portraits/        Portrait processing scripts
src-tauri/          Tauri shell, capabilities, icons, and Rust commands
public/assets/      Shipped portraits and client assets
assets-source/      Source portrait inputs, never shipped to the client
```

A Vite plugin fails the build if portrait source files land under `public/assets/portraits/source/`. Keep source images under `assets-source/portraits/<member-id>/`.

## Releases

`.github/workflows/release-desktop.yml` is the normal desktop release path. It runs from pushed `v*` tags or manual dispatch, validates release readiness with `vp run release:check`, builds the Windows installer on a Windows runner, builds the macOS universal DMG and updater archive on a macOS runner, signs updater artifacts from GitHub secrets, creates the versioned prerelease, uploads the player README and package assets, and refreshes the `desktop-alpha` updater channel.

`vp run tauri:build` remains the local release gate for desktop packaging because it includes `vp check`, type generation, TypeScript, tests, desktop bundle verification, and Tauri packaging. Local release builds need `TAURI_SIGNING_PRIVATE_KEY` set to the updater private key path or contents so the updater artifacts are signed.

Public release notes live in `app/fixtures/release-notes.json`. Use `vp run release:notes` to render GitHub or updater notes. The app opens a What's new modal after an update for saves with existing progress, and Settings can reopen those notes.

Desktop updates use Tauri's signed static JSON updater pattern. The app checks:

```text
https://github.com/GabrielHub/idc/releases/download/desktop-alpha/latest.json
```

Each versioned GitHub prerelease owns the Windows installer, macOS DMG, updater archives, checksums, `.sig` files, and a copy of `latest.json`. The fixed `desktop-alpha` GitHub release owns the active updater channel by replacing only `latest.json`, with platform entries for Windows, Apple Silicon Macs, and Intel Macs.

Installed desktop builds check for updates once after launch and expose a manual Settings, Updates check. If a signed update is available, the settings button shows an Update badge. Installation always waits for the player to choose Install.

Renderer failures show a crash report screen with Save bug report, Copy report, reload actions, and Show log folder on desktop builds. Rust panics from the Tauri shell are written to the same rolling desktop log file so playtest reports can include both sides of the app.

Do not regenerate the updater private key for normal releases. Installed apps trust the public key in `src-tauri/tauri.conf.json`, so key rotation requires shipping a build that trusts the new public key before publishing packages signed by that key. The full desktop release flow is in [app/docs/workflows/release-checklist.tsx](app/docs/workflows/release-checklist.tsx).

## Documentation

The docs are TSX modules under `app/docs/` and render at `/docs`. Browser dev renders the full manual. Desktop builds keep workflow entries visible but redact internal workflow bodies. Agents and humans both read the TSX files directly.

- [Field manual index](app/routes/docs.tsx): rendered as `/docs` with roadmap, product, gameplay, workflows, and support drawers.
- [Roadmap](app/docs/roadmap/index.tsx): active implementation board and status lanes.
- [Authoring plans](app/docs/roadmap/authoring-plans.tsx): temporary roadmap plan shape, lifecycle, and closeout policy.
- [Desktop install guide](app/docs/support/desktop-install-guide.tsx): private alpha install flow, provider setup, save locations, logs, updates, caveats.
- [Release README](app/docs/support/release-readme.tsx): short install notes for player-facing GitHub release assets.
- [Desktop release workflow](app/docs/workflows/release-checklist.tsx): release, updater, fallback, and desktop bundle flow.
- [Add a member](app/docs/workflows/add-member.tsx): content checklist for one new member.
- [Add a date scenario](app/docs/workflows/add-date-scenario.tsx): content checklist for one new date scenario.
- [Visual asset iteration](app/docs/workflows/visual-asset-iteration.tsx): independent image workflow for portraits, variants, and backgrounds.
- [Visual design](app/docs/product/visual-design.tsx): Aura interface direction, chat bubbles, member auras, canvas layout, scenario cards.
- [Image style](app/docs/product/image-style.tsx): portrait style, prompt construction, cutout pipeline, scenario backgrounds.
- [Voice and tone](app/docs/product/voice.tsx): corporate voice, member register, prose mechanics, manager fingerprint.
- [Voice patterns](app/docs/product/voice-patterns.tsx): reusable comedic and prose pattern gallery.
- [Voice fingerprints](app/docs/product/voice-fingerprints.tsx): fixture-level member voice contract and dealbreaker fire-shapes.
- [Voice in prompts and surfaces](app/docs/product/voice-prompts.tsx): prompt surfaces, model quirks, event-kind rules, and runtime voice application.
- [Manager check-in quips](app/docs/product/manager-quips.tsx): Eleven quip catalog, prompting playbook, and implementation contract.
- [Tutorial system](app/docs/product/tutorial-system.tsx): first-run orientation contract, state, primitives, and completion rules.
- [Tutorial steps](app/docs/product/tutorial-steps.tsx): verbatim tutorial copy and trigger catalog.
- [Character heights](app/docs/product/character-heights.tsx): height canon and lineup calibration.
- [Member fields and tags](app/docs/gameplay/member-fields-and-tags.tsx): authored fields, hidden tag taxonomy, request tags.
- [Player knowledge](app/docs/gameplay/player-knowledge.tsx): public/gated/never visibility tiers and filed reads.
- [Match fit](app/docs/gameplay/match-fit.tsx): deterministic booking pressure, badge rules, boundary risk.
- [Pair memory](app/docs/gameplay/pair-memory.tsx): pair state, agreements, open loops, hidden trajectory.
- [Case management](app/docs/gameplay/case-management.tsx): focus cases, shift cadence, closures, win conditions.
- [Roster chemistry](app/docs/gameplay/roster-chemistry.tsx): clusters, friction zones, four-anchor pass, per-pair matrix.
- [Agent instructions](AGENTS.md): architecture rules, toolchain conventions, copy style, UI rules.
