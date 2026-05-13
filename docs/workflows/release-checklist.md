# Friend Share Release Checklist

Use this flow for unsigned test releases that are good enough to share with friends, but still clearly marked as prerelease builds.

## Updater model

Installed desktop builds check a fixed public GitHub release asset:

```text
https://github.com/GabrielHub/idc/releases/download/desktop-alpha/latest.json
```

Each versioned prerelease, for example `v0.1.5`, owns the installable artifacts: the NSIS installer, player README, `.sha256`, `.sig`, and a copy of `latest.json`. The `desktop-alpha` release is the update channel. It should only contain the current `latest.json`, which points to the installer on the versioned prerelease.

The app checks for updates once after launch and exposes a manual Settings, Updates check. A discovered update shows an Update badge on the settings button. Installation remains user-initiated.

The updater private key signs each release. Do not regenerate it for normal releases. Installed apps trust the public key already checked into `src-tauri/tauri.conf.json`, so a lost private key means those installs cannot receive future updates.

## Automated GitHub release

The default release path is `.github/workflows/release-desktop.yml`. It runs on pushed `v*` tags or by manual dispatch with a tag. The workflow builds the Windows desktop package, signs updater artifacts using GitHub environment secrets, creates or updates the versioned prerelease, uploads the player README, checksum, signature, and `latest.json`, then updates the fixed `desktop-alpha` updater channel.

The `desktop-release` environment and updater signing secret are already configured for this repo. Do not generate a new updater key for normal releases.

The workflow starts with a no-secret preflight job that runs `vp check`, `vp test`, and `vp build` before requesting approval for the signing environment. It creates release notes with the installer name, SHA256 checksum, a changelog from commits since the previous version tag, and player install notes. For extra hand-written notes, use manual dispatch and fill the `release_notes` input, or edit the GitHub release after the workflow finishes.

Normal release flow:

1. Start clean and fetch tags.

   ```powershell
   git status --short --branch
   git fetch --tags origin
   ```

2. Pick the next version. For a test release, bump the patch version unless there is a reason to change minor. Update all release identity files together:
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`
   - the Tauri window title in `src-tauri/tauri.conf.json`

   `src-tauri/Cargo.lock` is refreshed by the Rust build after the `Cargo.toml` version changes.

3. Run local preflight.

   ```powershell
   vp check
   vp test
   vp build
   ```

   Fix failures before tagging. The workflow repeats these checks before it can access signing secrets.

4. Commit the release prep and push it.

   ```powershell
   $version = (Get-Content -Raw -LiteralPath "package.json" | ConvertFrom-Json).version
   git add package.json src-tauri\Cargo.toml src-tauri\Cargo.lock src-tauri\tauri.conf.json
   git commit -m "Prepare v${version} test release"
   git push origin main
   ```

   Stage only files that actually changed for the release. Include workflow or support docs only when they changed. Do not stage ignored artifacts under `src-tauri/target/`.

5. Create and push the version tag.

   ```powershell
   git tag -a "v${version}" -m "IDC v${version} test release"
   git push origin "v${version}"
   ```

6. Open GitHub Actions. If the preflight job passes, approve the `desktop-release` environment job and wait for it to finish.

7. Verify the versioned prerelease and the `desktop-alpha` release exist. The workflow already checks the uploaded README, checksum, signature, and updater manifest, but GitHub should show the assets before you share the release link.

## Manual fallback

Use this only when GitHub Actions is unavailable or you need to debug packaging locally.

1. Start clean and fetch tags.

   ```powershell
   git status --short --branch
   git fetch --tags origin
   ```

2. Pick the next version. For a test release, bump the patch version unless there is a reason to change minor. Update all release identity files together:
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`
   - the Tauri window title in `src-tauri/tauri.conf.json`

   `src-tauri/Cargo.lock` is refreshed by the Rust build after the `Cargo.toml` version changes.

3. Install dependencies, load the updater signing key, and build the release.

   ```powershell
   vp install
   $updaterSigningKeyPath = "$env:USERPROFILE\.tauri\idc-updater.key"
   if (-not (Test-Path -LiteralPath $updaterSigningKeyPath)) {
     throw "Missing updater signing key: $updaterSigningKeyPath"
   }
   $env:TAURI_SIGNING_PRIVATE_KEY = $updaterSigningKeyPath
   vp run tauri:build
   ```

   First-time key setup for the release owner, only before shipping the first updater-enabled build:

   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.tauri" | Out-Null
   vp run tauri signer generate --ci -w "$env:USERPROFILE\.tauri\idc-updater.key"
   ```

   Keep the private key secret and backed up. `TAURI_SIGNING_PRIVATE_KEY` may be the private key path or contents. If the key was generated with a password, also set `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` before building. Do not rely on `.env` files for Tauri updater signing.

   `vp run tauri:build` runs `vp check`, React Router typegen, `tsc`, `vp test run`, the desktop SPA build, the desktop bundle verifier, and the Tauri package step. The updater config also creates a signed updater artifact next to the installer.

4. Run the stricter release preflight.

   ```powershell
   $env:IDC_RELEASE_PREFLIGHT = "1"
   $env:IDC_COPYRIGHT_CONFIRMED = "Copyright (c) 2026 IDC team"
   vp node scripts/verify-desktop-build.mjs
   ```

5. Create a SHA256 checksum and updater manifest. GitHub normalizes asset names by replacing spaces with dots, so write the checksum file against the downloaded asset name.

   ```powershell
   $version = (Get-Content -Raw -LiteralPath "package.json" | ConvertFrom-Json).version
   $bundleDir = "src-tauri\target\release\bundle\nsis"
   $installer = Join-Path $bundleDir "IDC_${version}_x64-setup.exe"
   $signature = "${installer}.sig"
   $checksum = "${installer}.sha256"
   $manifest = Join-Path $bundleDir "latest.json"

   foreach ($path in @($installer, $signature)) {
     if (-not (Test-Path -LiteralPath $path)) {
       throw "Missing release artifact: $path"
     }
   }

   $hash = (Get-FileHash -LiteralPath $installer -Algorithm SHA256).Hash.ToLowerInvariant()
   "$hash  IDC_${version}_x64-setup.exe" | Set-Content -LiteralPath $checksum -Encoding ascii
   Get-Content -LiteralPath $checksum
   vp run updater:manifest
   Get-Content -LiteralPath $manifest
   ```

6. Write release notes. Keep them short and include:
   - unsigned Windows build warning
   - AI provider requirement
   - checksum
   - update behavior for alpha saves and Gateway key storage
   - the fact that in-app updates are signed and served through the `desktop-alpha` updater channel
   - playtest bug report guidance: copy the crash report, then attach the desktop log file
   - a link back to [desktop-install-guide.md](../support/desktop-install-guide.md)

7. Commit, tag, and push.

   ```powershell
   git add package.json src-tauri\Cargo.toml src-tauri\Cargo.lock src-tauri\tauri.conf.json
   git commit -m "Prepare v${version} test release"
   git tag -a "v${version}" -m "IDC v${version} test release"
   git push origin main "v${version}"
   ```

   Stage only files that actually changed for the release. Include release tooling files only when they changed. Do not stage ignored artifacts under `src-tauri/target/`.

8. Create the GitHub prerelease and upload the installer, player README, checksum, signature, and manifest.

   ```powershell
   $notes = "src-tauri\target\release\bundle\nsis\release-notes-v${version}.md"
   $playerReadme = "docs\support\release-readme.md"
   gh release create "v${version}" $installer $playerReadme $checksum $signature $manifest `
     --repo GabrielHub/idc `
     --title "IDC v${version} test alpha" `
     --notes-file $notes `
     --prerelease
   ```

9. Update the public updater channel metadata.

   The installed app checks this fixed endpoint:

   ```text
   https://github.com/GabrielHub/idc/releases/download/desktop-alpha/latest.json
   ```

   Create the channel release once, then overwrite `latest.json` on later releases.

   ```powershell
   gh release view "desktop-alpha" --repo GabrielHub/idc *> $null
   if ($LASTEXITCODE -ne 0) {
     gh release create "desktop-alpha" $manifest `
       --repo GabrielHub/idc `
       --title "IDC desktop alpha update channel" `
       --notes "Updater metadata for the current desktop alpha." `
       --prerelease
   } else {
     gh release upload "desktop-alpha" $manifest `
       --repo GabrielHub/idc `
       --clobber
   }
   ```

10. Verify the published release and updater channel.

```powershell
gh release view "v${version}" --repo GabrielHub/idc
gh release view "desktop-alpha" --repo GabrielHub/idc
$dir = Join-Path $env:TEMP "idc-cupid-v${version}-release-check"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
gh release download "v${version}" --repo GabrielHub/idc --pattern "release-readme.md" --dir $dir --clobber
gh release download "v${version}" --repo GabrielHub/idc --pattern "*.sha256" --dir $dir --clobber
gh release download "v${version}" --repo GabrielHub/idc --pattern "*.sig" --dir $dir --clobber
gh release download "desktop-alpha" --repo GabrielHub/idc --pattern "latest.json" --dir $dir --clobber

$downloadedChecksum = Join-Path $dir "IDC_${version}_x64-setup.exe.sha256"
$downloadedPlayerReadme = Join-Path $dir "release-readme.md"
$downloadedManifest = Join-Path $dir "latest.json"
if (-not (Test-Path -LiteralPath $downloadedPlayerReadme)) {
  throw "Missing player README asset"
}
Get-Content -LiteralPath $downloadedChecksum
Get-Content -LiteralPath $downloadedManifest

$latest = Get-Content -Raw -LiteralPath $downloadedManifest | ConvertFrom-Json
$windowsUpdate = $latest.platforms.'windows-x86_64'
if ($latest.version -ne $version) {
  throw "latest.json version $($latest.version) does not match $version"
}
if ($windowsUpdate.url -notlike "*releases/download/v${version}/IDC_${version}_x64-setup.exe") {
  throw "latest.json points at the wrong installer: $($windowsUpdate.url)"
}
if ([string]::IsNullOrWhiteSpace($windowsUpdate.signature)) {
  throw "latest.json is missing the Windows signature"
}
```

The release is ready to share when GitHub shows `prerelease: true`, the installer asset, the player README asset, the `.sha256` asset, the `.sig` asset, and the checksum file matches the notes. The in-app updater is ready when the `desktop-alpha` release has `latest.json` pointing at the new versioned installer URL.

## Desktop bundle layout

On Windows, the shareable installer is written to:

```text
src-tauri/target/release/bundle/nsis/IDC_<version>_x64-setup.exe
```

macOS `.app` and `.dmg` artifacts must be built on macOS. The Windows machine only produces the Windows installer.
