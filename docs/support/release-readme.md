# IDC Alpha Install Notes

IDC is a private alpha desktop game. The app is unsigned for now, so Windows or macOS may warn you before opening it. Read this before you double click anything.

## What to download

- Windows: download `IDC_<version>_x64-setup.exe`.
- macOS: download the `.dmg` or `.app` build if one is listed for this release.
- You do not need the source code, `latest.json`, `.sig`, or `.sha256` files unless the team asks for them.

## Install

### Windows

1. Run `IDC_<version>_x64-setup.exe`.
2. If Windows SmartScreen says the publisher is unknown, choose **More info**, then **Run anyway**.
3. Open IDC from the Start menu.
4. Click **Clock in**.
5. Open **AI setup** when prompted and choose either local Ollama or Cloud Gateway.

### macOS

1. Open the downloaded `.dmg` or app bundle.
2. Drag IDC into Applications if prompted.
3. On first launch, macOS may block the app because it is unsigned. Right click IDC, choose **Open**, then confirm.
4. Click **Clock in**.
5. Open **AI setup** when prompted and choose either local Ollama or Cloud Gateway.

## AI setup

IDC needs one AI provider before you can book dates.

- **Local:** install Ollama, keep it running, and ask the team which model to pull for this build.
- **Cloud:** use a Vercel AI Gateway key from the team or your own Vercel project.

The app does not include a no-AI date mode.

## Updating

IDC checks for updates after launch. If an update appears in Settings, choose **Install** when you are ready. Your local saves should stay in place when updating.

After an update, IDC opens a **What's new** modal with the current patch notes and a few recent versions. You can reopen it from Settings.

If update install fails, download the newest installer from the release page and run it.

## Getting help

If the app shows an error, send the team:

1. A screenshot of the error.
2. What you clicked right before it happened.
3. Your provider choice: Ollama or Cloud Gateway.

If the app shows a crash report screen, choose **Save bug report** and send the generated JSON file. In IDC, open Settings and choose **Show log folder** only if the team asks for full logs.

For the full install guide, open the desktop install guide in the app docs.
