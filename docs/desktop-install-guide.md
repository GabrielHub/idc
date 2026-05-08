# IDC: Cupid desktop install guide

Private alpha. Unsigned builds. The install path is friction now and that is expected.

## What you get

- A standalone desktop window. No browser tab, no Node server.
- File saves stored under your user app data directory.
- Runtime AI through your local Ollama or a Vercel AI Gateway key you enter in app.

## Pick a provider

You need one. Cupid will not book a date until the AI desk reads ready.

### Option A: Ollama

1. Install Ollama from https://ollama.com.
2. Pull the chat model.
   ```
   ollama pull gemma4:26b
   ```
   You can swap to a smaller model if your GPU is light. The catalog inside AI setup lists what Cupid recommends.
3. Pull the embedding model.
   ```
   ollama pull embeddinggemma
   ```
4. Make sure Ollama is running. The default port is 11434. Cupid does not need `OLLAMA_ORIGINS` because the desktop build talks to Ollama through a Tauri HTTP scope, not the browser CORS path.

### Option B: Vercel AI Gateway

1. Get a Gateway key from your Vercel project settings.
2. Open AI setup inside the app, switch the desk to Cloud, and paste the key into the api key field.
3. Cupid stores the key in app local data on this device, outside save files. Wiping a save leaves the key in place. Saving a blank key removes it.

## Install

### Windows

1. Download the NSIS installer from the release link the team shared.
2. Run it. SmartScreen will warn that the publisher is unknown because the build is unsigned. Click More info, then Run anyway.
3. The installer drops the app into your user profile, no admin prompt.

### macOS

1. Download the DMG or app bundle from the release link.
2. Drag IDC: Cupid.app into Applications.
3. The first launch will be blocked because the build is unsigned. Right-click the app, choose Open, and confirm. After the first run the system remembers and stops nagging.

## First run

1. Punch in. Cupid issues your badge and seeds the roster.
2. Open AI setup from the splash hint or the dashboard chrome.
3. Pick a provider, fill the fields, and Save and verify. Wait for the readiness check.
4. Once the desk reads ready, book a date from the brief view.

## Where saves live

- Windows: `%LOCALAPPDATA%\dev.idc.cupid\saves\`
- macOS: `~/Library/Application Support/dev.idc.cupid/saves/`

The save is a JSON file. Wipe it to reset, copy it to back up, paste it into a new install to migrate.

Gateway key storage lives under the same app local data root in `secrets/gateway-api-key.txt`. It is not part of the save backup path.

## Uninstall

- Windows: Settings, Apps, IDC: Cupid, Uninstall. The app data directory is preserved unless you delete it manually.
- macOS: drag IDC: Cupid.app to Trash. The Application Support directory is preserved unless you delete it manually.

## Known caveats

- Unsigned builds. You will see SmartScreen and Gatekeeper warnings until the team ships signed releases.
- Custom Ollama or Gateway hostnames are not supported. The desktop HTTP scope is fixed to localhost Ollama and the default Vercel AI Gateway. Custom hosts need a build with an updated scope.
- The playground route is not present in desktop builds. It only exists in the browser dev shell.
- No auto-update. New releases need a fresh download.
