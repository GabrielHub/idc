# Interdimensional Dating Coach (IDC) desktop install guide

Private alpha. Unsigned builds. The install path is friction now and that is expected.

## What you get

- A standalone desktop window. No browser tab, no Node server.
- File saves stored under your user app data directory.
- Runtime AI through your local Ollama or a Vercel AI Gateway key you enter in app.

## Pick a provider

You need one. Cupid will not book a date until the AI desk reads ready.

### Option A: Ollama (local, private)

The local route. Prompts, character data, and date transcripts stay on your machine.

1. Install Ollama from https://ollama.com.
2. Pull the chat model.
   ```
   ollama pull gemma4:e4b
   ```
   This is the default and runs on most 8 to 12 GB GPUs. The catalog inside AI setup lists alternatives for compact and large cards.
3. Pull the embedding model.
   ```
   ollama pull embeddinggemma
   ```
4. Make sure Ollama is running. The default port is 11434. Cupid does not need `OLLAMA_ORIGINS` because the desktop build talks to Ollama through a Tauri HTTP scope, not the browser CORS path.
5. Reasoning can be enabled in AI setup for local models that support Ollama `think`. Models without thinking support still answer normally.

### Option B: Vercel AI Gateway (cloud)

The cloud route. Date prompts, character context, and transcripts are sent through the native Vercel AI Gateway endpoint and forwarded to the model provider you choose. Use this only if you accept that data leaves your machine.

1. Get a Gateway key from your Vercel project settings.
2. Open AI setup inside the app, switch the desk to Cloud, and paste the key into the api key field.
3. The key is stored as a plaintext file in app local data on this device, outside save files. It is not encrypted and not in the OS keychain. Treat the device as the trust boundary. Wiping a save leaves the key in place at runtime, but uninstalling or updating the app wipes the key along with the rest of app data. Saving a blank key removes it.
4. Gateway reasoning offers `none`, `minimal`, `low`, `medium`, `high`, and `xhigh` where the selected provider accepts those values.

## Install

### Verify the download

Each release lists a SHA256 checksum next to every artifact. Verify before running, since the build is unsigned.

- Windows PowerShell:
  ```
  Get-FileHash .\IDC_<version>_x64-setup.exe -Algorithm SHA256
  ```
- macOS terminal:
  ```
  shasum -a 256 IDC_<version>_x64.dmg
  ```

Compare the printed value to the one in the release notes. If they differ, do not run the file. Ask the team for a fresh link.

### Windows

1. Download the NSIS installer from the release link the team shared.
2. Run it. SmartScreen will warn that the publisher is unknown because the build is unsigned. Click More info, then Run anyway.
3. The installer drops the app into your user profile, no admin prompt.

### macOS

1. Download the DMG or app bundle from the release link.
2. Drag IDC.app into Applications.
3. The first launch will be blocked because the build is unsigned. Right-click the app, choose Open, and confirm. After the first run the system remembers and stops nagging.

## First run

1. Punch in. Cupid issues your badge and seeds the roster.
2. Open AI setup from the splash hint or the top shell button.
3. Pick a provider, fill the fields, and Save and verify. Wait for the readiness check.
4. Once the desk reads ready, pick four focus cases, then book a date from the Live Date screen.

## Where saves live

- Windows: `%LOCALAPPDATA%\dev.idc.cupid\saves\`
- macOS: `~/Library/Application Support/dev.idc.cupid/saves/`

The save is a JSON file. Wipe it to reset or copy it to back up. Alpha saves are versioned to the current build only. When the schema changes, Cupid starts a fresh save instead of migrating old files.

Gateway key storage lives under the same app local data root in `secrets/gateway-api-key.txt`. It is not part of the save backup path.

## Uninstall

- Windows: Settings, Apps, IDC, Uninstall. The uninstaller wipes the entire app data directory: saves, logs, Gateway key, and WebView2 cache. Back up `%LOCALAPPDATA%\dev.idc.cupid\saves\` first if you want to keep a save.
- macOS: drag IDC.app to Trash. The Application Support directory is preserved unless you delete it manually.

## Updating

Run the new installer. It silently uninstalls the previous version before installing, which means **your saves and Gateway key are wiped on every update**. Alpha builds are not save-compatible across versions. This is expected until a release line exists, so start a new save after updating.

## Data flow

- Ollama route: prompts, character data, and date transcripts stay on the machine. Only your Ollama process sees them.
- Gateway route: prompts, character context, date transcripts, and any retrieved memories are sent to `https://ai-gateway.vercel.sh/v3/ai` and forwarded to the model provider Cupid is configured to use. The Gateway key is the trust boundary.
- Save files are local files. Cupid does not phone home and there is no telemetry.

## Logs

The desktop shell writes a rolling log file under your app local data directory. If something goes wrong, open Settings, choose Show log folder, and attach the file when reporting the issue.

- Windows: `%LOCALAPPDATA%\dev.idc.cupid\logs\`
- macOS: `~/Library/Logs/dev.idc.cupid/`

## Known caveats

- Unsigned builds. You will see SmartScreen and Gatekeeper warnings until the team ships signed releases.
- Custom Ollama or Gateway hostnames are not supported. The desktop HTTP scope is fixed to localhost Ollama and the default Vercel AI Gateway. Custom hosts need a build with an updated scope.
- Gateway keys are plaintext on disk under app local data. Anyone with file access on this device can read them. There is no OS keychain integration in the alpha.
- The playground route is not present in desktop builds. It only exists in the browser dev shell.
- No auto-update. New releases need a fresh download.
