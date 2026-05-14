import {
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocLink,
  DocList,
  DocPage,
  DocSteps,
  DocSubsection,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "workflows/release-checklist",
  group: "workflows",
  title: "Friend-share release checklist",
  description:
    "Unsigned desktop prerelease flow: automated GitHub release path plus a manual local fallback for debugging.",
  order: 3,
};

export const lede = (
  <>
    Use this flow for unsigned test releases that are good enough to share with friends, but still
    clearly marked as prerelease builds.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "updater-model",
    title: "Updater model",
    body: (
      <>
        <P>Installed desktop builds check a fixed public GitHub release asset:</P>
        <DocCodeBlock>{`https://github.com/GabrielHub/idc/releases/download/desktop-alpha/latest.json`}</DocCodeBlock>
        <P>
          Each versioned prerelease, for example <DocCode>v0.1.5</DocCode>, owns the installable
          artifacts: the NSIS installer, player README, <DocCode>.sha256</DocCode>,{" "}
          <DocCode>.sig</DocCode>, and a copy of <DocCode>latest.json</DocCode>. The{" "}
          <DocCode>desktop-alpha</DocCode> release is the update channel. It should only contain the
          current <DocCode>latest.json</DocCode>, which points to the installer on the versioned
          prerelease.
        </P>
        <P>
          The app checks for updates once after launch and exposes a manual Settings, Updates check.
          A discovered update shows an Update badge on the settings button. Installation remains
          user-initiated.
        </P>
        <DocCallout variant="warn">
          The updater private key signs each release. Do not regenerate it for normal releases.
          Installed apps trust the public key already checked into{" "}
          <DocCode>src-tauri/tauri.conf.json</DocCode>, so a lost private key means those installs
          cannot receive future updates.
        </DocCallout>
      </>
    ),
  },
  {
    id: "automated-github-release",
    title: "Automated GitHub release",
    body: (
      <>
        <P>
          The default release path is <DocCode>.github/workflows/release-desktop.yml</DocCode>. It
          runs on pushed <DocCode>v*</DocCode> tags or by manual dispatch with a tag. The workflow
          builds the Windows desktop package, signs updater artifacts using GitHub environment
          secrets, creates or updates the versioned prerelease, uploads the player README, checksum,
          signature, and <DocCode>latest.json</DocCode>, then updates the fixed{" "}
          <DocCode>desktop-alpha</DocCode> updater channel.
        </P>
        <P>
          The <DocCode>desktop-release</DocCode> environment and updater signing secret are already
          configured for this repo. Do not generate a new updater key for normal releases.
        </P>
        <P>
          The workflow starts with a no-secret preflight job that runs <DocCode>vp check</DocCode>,{" "}
          <DocCode>vp test</DocCode>, and <DocCode>vp build</DocCode> before requesting approval for
          the signing environment. It renders public release notes from{" "}
          <DocCode>app/fixtures/release-notes.json</DocCode>, adds the installer name, SHA256
          checksum, and player install notes, then uses the same catalog entry for the updater
          manifest notes. The workflow fails if the release version is missing from the catalog. For
          extra operator notes, use manual dispatch and fill the <DocCode>release_notes</DocCode>{" "}
          input.
        </P>
        <DocSubsection id="normal-release-flow" title="Normal release flow">
          <DocSteps
            items={[
              <span key="clean">
                Start clean and fetch tags.
                <DocCodeBlock language="powershell">{`git status --short --branch
git fetch --tags origin`}</DocCodeBlock>
              </span>,
              <span key="version">
                Pick the next version. For a test release, bump the patch version unless there is a
                reason to change minor. Update all release identity files together:{" "}
                <DocCode>package.json</DocCode>, <DocCode>src-tauri/Cargo.toml</DocCode>,{" "}
                <DocCode>src-tauri/tauri.conf.json</DocCode>, and the Tauri window title in{" "}
                <DocCode>src-tauri/tauri.conf.json</DocCode>.{" "}
                <DocCode>src-tauri/Cargo.lock</DocCode> is refreshed by the Rust build after the{" "}
                <DocCode>Cargo.toml</DocCode> version changes.
              </span>,
              <span key="public-notes">
                Add a player-facing entry to <DocCode>app/fixtures/release-notes.json</DocCode>.
                Keep it short, useful, and free of commit-log chores. The current version plus the
                previous couple entries show in the in-app What's new modal after an update.
              </span>,
              <span key="preflight">
                Run local preflight.
                <DocCodeBlock language="powershell">{`vp check
vp test
vp build`}</DocCodeBlock>
                Fix failures before tagging. The workflow repeats these checks before it can access
                signing secrets.
              </span>,
              <span key="commit">
                Commit the release prep and push it.
                <DocCodeBlock language="powershell">{`$version = (Get-Content -Raw -LiteralPath "package.json" | ConvertFrom-Json).version
git add package.json src-tauri\\Cargo.toml src-tauri\\Cargo.lock src-tauri\\tauri.conf.json app\\fixtures\\release-notes.json
git commit -m "Prepare v\${version} test release"
git push origin main`}</DocCodeBlock>
                Stage only files that actually changed for the release, including{" "}
                <DocCode>app/fixtures/release-notes.json</DocCode>. Include workflow or support docs
                only when they changed. Do not stage ignored artifacts under{" "}
                <DocCode>src-tauri/target/</DocCode>.
              </span>,
              <span key="tag">
                Create and push the version tag.
                <DocCodeBlock language="powershell">{`git tag -a "v\${version}" -m "IDC v\${version} test release"
git push origin "v\${version}"`}</DocCodeBlock>
              </span>,
              "Open GitHub Actions. If the preflight job passes, approve the desktop-release environment job and wait for it to finish.",
              <span key="verify">
                Verify the versioned prerelease and the <DocCode>desktop-alpha</DocCode> release
                exist. The workflow already checks the uploaded README, checksum, signature, and
                updater manifest, but GitHub should show the assets before you share the release
                link.
              </span>,
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [{ id: "normal-release-flow", title: "Normal release flow" }],
  },
  {
    id: "manual-fallback",
    title: "Manual fallback",
    body: (
      <>
        <DocCallout variant="warn">
          Use this only when GitHub Actions is unavailable or you need to debug packaging locally.
        </DocCallout>
        <DocSteps
          items={[
            <span key="clean">
              Start clean and fetch tags.
              <DocCodeBlock language="powershell">{`git status --short --branch
git fetch --tags origin`}</DocCodeBlock>
            </span>,
            "Pick the next version and update package.json, src-tauri/Cargo.toml, src-tauri/tauri.conf.json, and the Tauri window title together (same identity files as the automated flow).",
            <span key="install">
              Install dependencies, load the updater signing key, and build the release.
              <DocCodeBlock language="powershell">{`vp install
$updaterSigningKeyPath = "$env:USERPROFILE\\.tauri\\idc-updater.key"
if (-not (Test-Path -LiteralPath $updaterSigningKeyPath)) {
  throw "Missing updater signing key: $updaterSigningKeyPath"
}
$env:TAURI_SIGNING_PRIVATE_KEY = $updaterSigningKeyPath
vp run tauri:build`}</DocCodeBlock>
              First-time key setup for the release owner only, before shipping the first
              updater-enabled build:
              <DocCodeBlock language="powershell">{`New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\\.tauri" | Out-Null
vp run tauri signer generate --ci -w "$env:USERPROFILE\\.tauri\\idc-updater.key"`}</DocCodeBlock>
              Keep the private key secret and backed up.{" "}
              <DocCode>TAURI_SIGNING_PRIVATE_KEY</DocCode> may be the private key path or contents.
              If the key was generated with a password, also set{" "}
              <DocCode>TAURI_SIGNING_PRIVATE_KEY_PASSWORD</DocCode> before building. Do not rely on{" "}
              <DocCode>.env</DocCode> files for Tauri updater signing.
              <P>
                <DocCode>vp run tauri:build</DocCode> runs <DocCode>vp check</DocCode>, React Router
                typegen, <DocCode>tsc</DocCode>, <DocCode>vp test run</DocCode>, the desktop SPA
                build, the desktop bundle verifier, and the Tauri package step. The updater config
                also creates a signed updater artifact next to the installer.
              </P>
            </span>,
            <span key="strict">
              Run the stricter release preflight.
              <DocCodeBlock language="powershell">{`$env:IDC_RELEASE_PREFLIGHT = "1"
$env:IDC_COPYRIGHT_CONFIRMED = "Copyright (c) 2026 IDC team"
vp node scripts/verify-desktop-build.mjs`}</DocCodeBlock>
            </span>,
            <span key="checksum">
              Create a SHA256 checksum and updater manifest. GitHub normalizes asset names by
              replacing spaces with dots, so write the checksum file against the downloaded asset
              name.
              <DocCodeBlock language="powershell">{`$version = (Get-Content -Raw -LiteralPath "package.json" | ConvertFrom-Json).version
$bundleDir = "src-tauri\\target\\release\\bundle\\nsis"
$installer = Join-Path $bundleDir "IDC_\${version}_x64-setup.exe"
$signature = "\${installer}.sig"
$checksum = "\${installer}.sha256"
$manifest = Join-Path $bundleDir "latest.json"
$hash = (Get-FileHash -LiteralPath $installer -Algorithm SHA256).Hash.ToLowerInvariant()
"$hash  IDC_\${version}_x64-setup.exe" | Set-Content -LiteralPath $checksum -Encoding ascii
vp run updater:manifest`}</DocCodeBlock>
            </span>,
            <span key="notes">
              Add or update the public catalog entry, then render release notes from the catalog.
              <DocCodeBlock language="powershell">{`vp node scripts/render-release-notes.mjs \`
  --format github \`
  --version $version \`
  --tag "v$version" \`
  --installer "IDC_$($version)_x64-setup.exe" \`
  --sha256 $hash \`
  --output "src-tauri\\target\\release\\bundle\\nsis\\release-notes-v$version.md"`}</DocCodeBlock>
              The renderer adds the unsigned Windows build warning, AI provider requirement, SHA256
              checksum, and <DocCode>release-readme.md</DocCode> attachment note.
            </span>,
            <span key="tag">
              Commit, tag, and push.
              <DocCodeBlock language="powershell">{`git add package.json src-tauri\\Cargo.toml src-tauri\\Cargo.lock src-tauri\\tauri.conf.json app\\fixtures\\release-notes.json
git commit -m "Prepare v\${version} test release"
git tag -a "v\${version}" -m "IDC v\${version} test release"
git push origin main "v\${version}"`}</DocCodeBlock>
            </span>,
            <span key="create">
              Create the GitHub prerelease and upload the installer, player README, checksum,
              signature, and manifest.
              <DocCodeBlock language="powershell">{`$notes = "src-tauri\\target\\release\\bundle\\nsis\\release-notes-v\${version}.md"
$playerReadme = "docs\\support\\release-readme.md"
gh release create "v\${version}" $installer $playerReadme $checksum $signature $manifest \`
  --repo GabrielHub/idc \`
  --title "IDC v\${version} test alpha" \`
  --notes-file $notes \`
  --prerelease`}</DocCodeBlock>
            </span>,
            <span key="channel">
              Update the public updater channel metadata. Create the channel release once, then
              overwrite <DocCode>latest.json</DocCode> on later releases.
              <DocCodeBlock language="powershell">{`gh release view "desktop-alpha" --repo GabrielHub/idc *> $null
if ($LASTEXITCODE -ne 0) {
  gh release create "desktop-alpha" $manifest \`
    --repo GabrielHub/idc \`
    --title "IDC desktop alpha update channel" \`
    --notes "Updater metadata for the current desktop alpha." \`
    --prerelease
} else {
  gh release upload "desktop-alpha" $manifest \`
    --repo GabrielHub/idc \`
    --clobber
}`}</DocCodeBlock>
            </span>,
            <span key="verify">
              Verify the published release and updater channel.
              <DocCodeBlock language="powershell">{`gh release view "v\${version}" --repo GabrielHub/idc
gh release view "desktop-alpha" --repo GabrielHub/idc`}</DocCodeBlock>
              Confirm prerelease: true, the installer asset, the player README asset, the{" "}
              <DocCode>.sha256</DocCode> asset, the <DocCode>.sig</DocCode> asset, and that{" "}
              <DocCode>latest.json</DocCode> on <DocCode>desktop-alpha</DocCode> points at the new
              versioned installer URL.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "desktop-bundle-layout",
    title: "Desktop bundle layout",
    body: (
      <>
        <P>On Windows, the shareable installer is written to:</P>
        <DocCodeBlock>{`src-tauri/target/release/bundle/nsis/IDC_<version>_x64-setup.exe`}</DocCodeBlock>
        <DocCallout variant="info">
          macOS <Strong>.app</Strong> and <Strong>.dmg</Strong> artifacts must be built on macOS.
          The Windows machine only produces the Windows installer.
        </DocCallout>
        <DocList
          items={[
            <span key="readme">
              Player-facing install notes live at{" "}
              <DocLink to="/docs/support/release-readme">Alpha install notes</DocLink>.
            </span>,
          ]}
        />
      </>
    ),
  },
];

export default function ReleaseChecklistDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
