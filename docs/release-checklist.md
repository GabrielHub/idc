# Friend Share Release Checklist

Use this flow for unsigned test releases that are good enough to share with friends, but still clearly marked as prerelease builds.

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

3. Install dependencies and build the release.

   ```powershell
   vp install
   vp run tauri:build
   ```

   `vp run tauri:build` runs `vp check`, React Router typegen, `tsc`, `vp test run`, the desktop SPA build, the desktop bundle verifier, and the Tauri package step.

4. Run the stricter release preflight.

   ```powershell
   $env:IDC_RELEASE_PREFLIGHT = "1"
   $env:IDC_COPYRIGHT_CONFIRMED = "Copyright (c) 2026 IDC team"
   vp node scripts/verify-desktop-build.mjs
   ```

5. Create a SHA256 checksum. GitHub normalizes asset names by replacing spaces with dots, so write the checksum file against the downloaded asset name.

   ```powershell
   $version = "0.1.2"
   $installer = "src-tauri\target\release\bundle\nsis\IDC_${version}_x64-setup.exe"
   $checksum = "src-tauri\target\release\bundle\nsis\IDC_${version}_x64-setup.exe.sha256"
   $hash = (Get-FileHash -LiteralPath $installer -Algorithm SHA256).Hash.ToLowerInvariant()
   "$hash  IDC_${version}_x64-setup.exe" | Set-Content -LiteralPath $checksum -Encoding ascii
   Get-Content -LiteralPath $checksum
   ```

6. Write release notes. Keep them short and include:
   - unsigned Windows build warning
   - AI provider requirement
   - checksum
   - update behavior for alpha saves and Gateway key storage
   - a link back to [desktop-install-guide.md](desktop-install-guide.md)

7. Commit, tag, and push.

   ```powershell
   git add package.json src-tauri\Cargo.toml src-tauri\Cargo.lock src-tauri\tauri.conf.json
   git commit -m "Prepare v${version} test release"
   git tag -a "v${version}" -m "IDC v${version} test release"
   git push origin main "v${version}"
   ```

   Stage only files that actually changed for the release. Include release tooling files only when they changed. Do not stage ignored artifacts under `src-tauri/target/`.

8. Create the GitHub prerelease and upload the installer plus checksum.

   ```powershell
   $notes = "src-tauri\target\release\bundle\nsis\release-notes-v${version}.md"
   gh release create "v${version}" $installer $checksum `
     --repo GabrielHub/idc `
     --title "IDC v${version} test alpha" `
     --notes-file $notes `
     --prerelease
   ```

9. Verify the published release.

   ```powershell
   gh release view "v${version}" --repo GabrielHub/idc
   $dir = Join-Path $env:TEMP "idc-cupid-v${version}-release-check"
   New-Item -ItemType Directory -Force -Path $dir | Out-Null
   gh release download "v${version}" --repo GabrielHub/idc --pattern "*.sha256" --dir $dir --clobber
   Get-Content -LiteralPath (Join-Path $dir "IDC_${version}_x64-setup.exe.sha256")
   ```

The release is ready to share when GitHub shows `prerelease: true`, the installer asset, the `.sha256` asset, and the checksum file matches the notes.

## Desktop bundle layout

On Windows, the shareable installer is written to:

```text
src-tauri/target/release/bundle/nsis/IDC_<version>_x64-setup.exe
```

macOS `.app` and `.dmg` artifacts must be built on macOS. The Windows machine only produces the Windows installer.
