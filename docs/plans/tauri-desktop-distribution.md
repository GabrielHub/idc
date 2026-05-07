# Plan: Tauri desktop distribution

## Objective

Ship IDC: Cupid as a private desktop build that friends can install and play without running a Node server.

The desktop app keeps gameplay, schemas, prompts, services, and fixtures in TypeScript. Tauri owns the native shell, scoped filesystem access, and scoped HTTP access. Rust does not own gameplay.

## Release Shape

- Windows: NSIS installer.
- macOS: DMG or app bundle.
- No Node sidecar.
- No bundled Ollama.
- No bundled model weights.
- Runtime AI remains required through local Ollama or Vercel AI Gateway.
- Friend builds must use file saves, not WebView localStorage saves.
- The AI playground is excluded from production desktop builds.

## Target Architecture

```text
React Router SPA
  -> UI components
  -> TypeScript game services
  -> LocalGameRepository
  -> RawSaveStore
       -> BrowserLocalStorageSaveStore in browser dev
       -> TauriAppLocalDataSaveStore in desktop

AI model service
  -> browser fetch in browser dev
  -> Tauri HTTP fetch in desktop
```

Tauri capabilities stay narrow:

- Filesystem scope: `$APPLOCALDATA/saves/*`.
- HTTP scope: local Ollama and the default Vercel AI Gateway URL only.
- CSP: local app assets only, plus the Tauri IPC endpoints.

## Phase 0: Save Platform Abstraction

Goal: make save storage a service boundary before the SPA and Tauri work.

Tasks:

1. Replace `KeyValueStorage` with an async raw save store contract:

   ```ts
   export interface RawSaveStore {
     read(key: string): Promise<string | null>;
     write(key: string, value: string): Promise<void>;
     delete(key: string): Promise<void>;
   }
   ```

2. Keep `LocalGameRepository` as the owner of save parsing, Zod validation, schema migration, fixture hydration, legacy save key migration, and serialization.
3. Move storage drivers into explicit files:
   - `app/repositories/raw-save-store.ts`
   - `app/repositories/memory-save-store.ts`
   - `app/repositories/browser-local-storage-save-store.ts`
   - `app/repositories/node-json-save-store.server.ts`
4. Add a repository factory:
   - `app/repositories/create-game-repository.ts`
   - Browser dev returns `BrowserLocalStorageSaveStore`.
   - Existing server route code returns `NodeJsonSaveStore` while SSR still exists.
   - Tauri support is added in Phase 3.
5. Update `CupidOperationsDashboard` and `SplashScreen` so they import only the repository factory, not storage drivers.
6. Update tests to use `MemorySaveStore`.
7. Preserve the current save key names and migration behavior.

Verification:

- `vp check`
- `vp test`
- Existing save migration tests still pass.
- Browser local saves still load after the refactor.

## Phase 1: Browser SPA Conversion

Goal: make the app run as a browser SPA with no React Router API routes.

Tasks:

1. Set `ssr: false` in `react-router.config.ts`.
2. Keep routes SSR safe. React Router still renders the root at build time to produce `index.html`, so browser APIs must stay inside effects, handlers, or guarded helpers.
3. Rename server modules after they are browser safe:
   - `app/services/ai/model-service.server.ts` to `app/services/ai/model-service.ts`
   - `app/services/ai-date-engine.server.ts` to `app/services/ai-date-engine.ts`
4. Remove the `process.env.AI_GATEWAY_API_KEY` fallback from the browser model service. Gateway keys come only from the AI setup panel runtime secret path.
5. Replace route API calls with direct service calls:
   - `requestLocalAiStatus` calls `checkAiReadiness`.
   - Ollama model scan calls `listOllamaModelInventory`.
   - Date advance and completion call `advanceDateExchangeWithLocalAiStream` and `completeDateSessionWithLocalAiStream`.
6. Keep the existing stream event shape in `game-api-contracts.ts` until a better shared name exists. The UI already consumes these events.
7. Extract playground AI logic into a normal service module if the playground remains available in browser dev.
8. Delete API routes only after no client code calls them:
   - `app/routes/api.game.ts`
   - `app/routes/api.playground-ai.ts`
   - `app/routes/api.playground-ai.test.ts`
9. Update `app/routes.ts` to route only the dashboard and the dev playground.

Verification:

- `vp check`
- `vp test`
- `vp build`
- Browser smoke at `http://localhost:5173/`.
- Ollama browser smoke with the local machine configured for browser CORS.
- Gateway smoke with a manually entered key.

## Phase 2: Tauri Shell

Goal: prove the static SPA boots inside Tauri. This phase is not distributable to friends yet.

Tasks:

1. Initialize Tauri 2:

   ```bash
   pnpm dlx @tauri-apps/cli@latest init
   ```

2. Add package scripts because Tauri has no `vp` equivalent:

   ```json
   {
     "tauri": "tauri",
     "tauri:dev": "tauri dev",
     "tauri:build": "tauri build"
   }
   ```

3. Add `@tauri-apps/cli` to dev dependencies.
4. Configure Tauri build integration:
   - `beforeDevCommand`: `vp dev`
   - `beforeBuildCommand`: `vp build --mode desktop`
   - `devUrl`: `http://localhost:5173`
   - `frontendDist`: `../build/client`
5. Add desktop build gates:
   - Exclude `/playground` from `app/routes.ts` when `import.meta.env.MODE === "desktop"`.
   - Hide the splash playground link for the same mode.
6. Replace remote Google Fonts usage before strict CSP:
   - Remove the remote `@import` in `app/app.css`.
   - Ship fonts locally or use system fallbacks for the desktop build.
7. Add a strict CSP after remote fonts are gone.

Verification:

- `vp build --mode desktop`
- `pnpm tauri:dev` opens the dashboard.
- `pnpm tauri:build` creates a local installer or app bundle.
- Installed desktop build has no playground link.
- Manually opening `/playground` in the installed app shows the route error.
- Search the desktop bundle for playground-only constants.

## Phase 3: Tauri File Saves And HTTP

Goal: make the desktop build use real file saves and Tauri HTTP. This is the first candidate for friend testing.

Tasks:

1. Add Tauri plugins:

   ```bash
   pnpm tauri add fs
   pnpm tauri add http
   ```

2. Add `app/platform/runtime.ts`:
   - Uses `isTauri()` from `@tauri-apps/api/core`.
   - Exposes platform helpers without leaking Tauri checks into repositories or UI.
3. Add `app/repositories/tauri-app-local-data-save-store.ts`:
   - Stores saves under `saves/<safe-key>.json`.
   - Uses `BaseDirectory.AppLocalData`.
   - Sanitizes save keys with the same character policy as the current Node driver.
4. Update `createGameRepository()`:
   - Browser dev uses `BrowserLocalStorageSaveStore`.
   - Desktop uses `TauriAppLocalDataSaveStore`.
   - Tests can inject `MemorySaveStore`.
5. If any Phase 2 builds were shared, add one-time migration from Tauri WebView localStorage to file saves. If no build escaped, skip the migration.
6. Add `app/services/ai/fetch-transport.ts`:
   - Browser dev returns global `fetch`.
   - Desktop returns Tauri HTTP plugin `fetch`.
7. Pass the selected fetch implementation to:
   - `createOllama`
   - `createOpenAICompatible`
   - direct Ollama discovery fetches
8. Lock editable provider base URLs in production desktop builds:
   - Ollama is `http://127.0.0.1:11434` or `http://localhost:11434`.
   - Gateway is the default Vercel AI Gateway base URL.
   - Custom hosts require a later build with an updated HTTP scope.
9. Add capabilities with generated schema validation:
   - `core:default`
   - FS commands scoped to `$APPLOCALDATA/saves/*`
   - HTTP scoped to local Ollama and Vercel AI Gateway
10. Keep Gateway keys out of save files. Current localStorage key storage is acceptable for private alpha only. Stronghold or OS-backed secret storage is a later public-release requirement.

Verification:

- `vp check`
- `vp test`
- `vp build --mode desktop`
- `pnpm tauri:build`
- Installed desktop build creates a JSON save under app local data.
- Save reload works after app restart.
- Reset save deletes the file.
- Ollama works with default Ollama settings and no `OLLAMA_ORIGINS`.
- Gateway works with a manually entered key.
- Bad Gateway key, missing Ollama model, and offline provider show existing unavailable states.

## Phase 4: Distribution Polish

Goal: make the friend build installable and explainable.

Tasks:

1. Add app icons in `src-tauri/icons/`.
2. Audit bundled asset size. Current `public/` assets are much larger than the Tauri shell, so portrait and audio size matter more than Tauri overhead.
3. Configure Windows NSIS:
   - Per-user install.
   - No admin requirement.
   - Product name: `IDC: Cupid`.
4. Configure macOS bundle or DMG.
5. Add a short friend install guide:
   - How to install.
   - How to choose Gateway or Ollama.
   - Ollama model pull commands.
   - SmartScreen or macOS warning expectations for unsigned builds.
6. Create release artifacts through GitHub Releases or a private file share.
7. Do not present unsigned builds as polished public distribution.

Signing decision:

- Private alpha can ship unsigned with explicit warning docs.
- Public or broader friend distribution needs macOS Developer ID notarization and Windows code signing.

Verification:

- Fresh Windows install.
- Fresh macOS install.
- First launch reaches splash.
- First run AI setup succeeds through Gateway.
- First run Ollama setup succeeds after model pulls.
- App restart preserves save.
- Uninstall and reinstall behavior is documented.

## Acceptance Criteria

The plan is complete when:

- `vp check`, `vp test`, and `vp build --mode desktop` pass.
- Desktop build uses file saves in app local data.
- Desktop build does not depend on a Node server.
- Desktop build does not require `OLLAMA_ORIGINS`.
- Runtime AI remains required for playable dates.
- Playground is absent from production desktop builds.
- The release notes tell friends what to install and what warnings to expect.

## Active Risks

- React Router SPA mode still pre-renders at build time. Browser-only code in render paths will break builds.
- Tauri HTTP scopes are static. Editable provider base URLs and narrow HTTP permissions conflict.
- The current asset bundle is about 93 MB before Tauri packaging.
- Unsigned builds create trust warnings. This is acceptable only for private alpha.
- Tauri desktop WebView testing is not covered by Playwright. Browser Playwright remains useful for SPA regressions, but installed desktop smoke is manual until a Tauri WebDriver setup exists.

## Out Of Scope For This Plan

- Rust rewrite of gameplay.
- Node sidecar.
- Bundled Ollama.
- Bundled models.
- Linux packages.
- Auto-updater.
- System tray, deep links, notifications, and multi-window UX.
- Public store distribution.
