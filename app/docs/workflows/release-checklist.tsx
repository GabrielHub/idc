import {
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocLink,
  DocList,
  DocPage,
  DocSteps,
  DocSubsection,
  DocTable,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "workflows/release-checklist",
  group: "workflows",
  title: "Desktop release workflow",
  description:
    "Canonical unsigned desktop prerelease flow: automated GitHub release path plus a manual local fallback for debugging.",
  order: 3,
};

export const lede = (
  <>
    Friend sharing is not a separate channel. It means making a real unsigned desktop prerelease,
    updating the public updater channel, and then sharing the versioned release link.
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
    id: "canonical-release",
    title: "Canonical release",
    body: (
      <>
        <P>
          A desktop release exists only after both public GitHub surfaces are correct: the versioned
          prerelease has the installable assets, and <DocCode>desktop-alpha</DocCode> has the
          current <DocCode>latest.json</DocCode> that points at that versioned installer. A passing
          preflight, a pushed tag, or a GitHub run that is waiting on the protected environment is a
          release attempt, not a shareable release.
        </P>
        <DocList
          items={[
            <span key="versioned">
              Versioned prerelease: <DocCode>vX.Y.Z</DocCode> owns the installer, player README,
              checksum, signature, updater manifest copy, and GitHub release notes.
            </span>,
            <span key="channel">
              Update channel: <DocCode>desktop-alpha</DocCode> owns the current
              <DocCode>latest.json</DocCode> used by installed apps.
            </span>,
            <span key="share">
              Friend share: send the versioned prerelease link only after the workflow verification
              step confirms both surfaces.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "recent-failures",
    title: "Recent failures",
    body: (
      <>
        <P>
          The last three failed release runs exposed separate gaps. Keep these linked here so future
          release debugging starts from evidence instead of folklore with a clipboard.
        </P>
        <DocTable
          headers={["Run", "Failure", "Earlier guard"]}
          rows={[
            [
              <DocLink key="run" to="https://github.com/GabrielHub/idc/actions/runs/25849393272">
                v0.2.6 run 25849393272
              </DocLink>,
              <span key="failure">
                The signed Windows build completed, then <DocCode>Prepare release assets</DocCode>{" "}
                failed because the workflow called <DocCode>vp node</DocCode>. Vite Plus did not
                expose that subcommand on the runner, so updater notes never rendered and no release
                assets were published.
              </span>,
              <span key="guard">
                <DocCode>vp run release:check --tag vX.Y.Z</DocCode> renders updater notes, GitHub
                notes, and a temporary updater manifest before signing.
              </span>,
            ],
            [
              <DocLink key="run" to="https://github.com/GabrielHub/idc/actions/runs/25906050553">
                v0.3.1 run 25906050553
              </DocLink>,
              <span key="failure">
                Preflight reached <DocCode>vp test</DocCode>, then failed because the release notes
                sort test had a hard-coded expected version list that did not include{" "}
                <DocCode>0.3.1</DocCode>.
              </span>,
              <span key="guard">
                The test now checks descending order, uniqueness, and current package coverage
                without requiring a manual expected list edit every release.
              </span>,
            ],
            [
              <DocLink key="run" to="https://github.com/GabrielHub/idc/actions/runs/25907119399">
                v0.3.1 run 25907119399
              </DocLink>,
              <span key="failure">
                Preflight passed, but <DocCode>Build and publish Windows</DocCode> stayed queued
                behind the protected <DocCode>desktop-release</DocCode> environment and never ran.
                The run ended with no versioned release assets and no updater channel update.
              </span>,
              <span key="guard">
                The workflow doc now treats environment approval and final asset verification as the
                release gate. A tag is not shareable until the Windows job finishes.
              </span>,
            ],
          ]}
        />
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
          the signing environment. Before those heavier checks, it runs{" "}
          <DocCode>node scripts/verify-release-readiness.mjs</DocCode> to validate release identity,
          catalog coverage, rendered GitHub notes, rendered updater notes, and temporary updater
          manifest shape without secrets. The publish job renders public release notes from{" "}
          <DocCode>app/fixtures/release-notes.json</DocCode>, adds the installer name, SHA256
          checksum, and player install notes, then uses the same catalog entry for the updater
          manifest notes. For extra operator notes, use manual dispatch and fill the{" "}
          <DocCode>release_notes</DocCode> input.
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
                <DocCodeBlock language="powershell">{`vp install
$version = (Get-Content -Raw -LiteralPath "package.json" | ConvertFrom-Json).version
vp run release:check --tag "v$version"
vp check
vp test
vp build`}</DocCodeBlock>
                Fix failures before tagging. The workflow repeats release readiness, formatting,
                lint, type, test, and browser build checks before it can access signing secrets.
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
              <span key="approve">
                Open GitHub Actions. If the preflight job passes, approve the{" "}
                <DocCode>desktop-release</DocCode> environment job and wait for{" "}
                <DocCode>Build and publish Windows</DocCode> to finish. Until that job completes,
                the tag is still an attempt and should not be shared.
              </span>,
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
    id: "failed-release-notes",
    title: "Failed releases and notes",
    body: (
      <>
        <P>
          Failed release attempts do not update installed apps by themselves. The in-app What's new
          modal reads the release catalog bundled into the installed build, not GitHub Actions logs
          and not the <DocCode>desktop-alpha</DocCode> release body. If a workflow fails before
          publishing and the updater channel is unchanged, players do not receive that build.
        </P>
        <P>
          A later successful build carries whatever entries are checked into{" "}
          <DocCode>app/fixtures/release-notes.json</DocCode>. The modal shows the current version
          plus the previous two catalog entries, so a failed version can appear as recent context if
          it remains in the catalog. The GitHub release page and updater manifest render only the
          current version entry unless that entry explicitly includes a section such as{" "}
          <DocCode>Included from v0.2.6</DocCode>.
        </P>
        <DocCallout variant="info">
          If a failed tag contained the real feature notes and no player could install it, move
          those notes to the next successful version or add an explicit included-from section to the
          retry entry. Do not assume a retry release automatically carries the previous GitHub
          changelog.
        </DocCallout>
      </>
    ),
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
            <span key="readiness">
              Install dependencies and run no-secret release readiness before touching the signing
              key.
              <DocCodeBlock language="powershell">{`vp install
$version = (Get-Content -Raw -LiteralPath "package.json" | ConvertFrom-Json).version
vp run release:check --tag "v$version"`}</DocCodeBlock>
            </span>,
            <span key="install">
              Load the updater signing key and build the release.
              <DocCodeBlock language="powershell">{`$updaterSigningKeyPath = "$env:USERPROFILE\\.tauri\\idc-updater.key"
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
node scripts/verify-desktop-build.mjs`}</DocCodeBlock>
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
              <DocCodeBlock language="powershell">{`node scripts/render-release-notes.mjs \`
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
