import {
  DocCallout,
  DocCode,
  DocCodeBlock,
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
  slug: "support/desktop-install-guide",
  group: "support",
  title: "Desktop install guide",
  description:
    "Private alpha install path: provider setup, update behavior, save locations, log folders, and known caveats.",
  order: 0,
};

export const lede = (
  <>
    Private alpha. Unsigned builds. The install path is friction right now and that is expected.
    This guide explains every step the build does not yet automate.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "what-you-get",
    title: "What you get",
    body: (
      <DocList
        items={[
          "A standalone desktop window. No browser tab, no Node server.",
          "File saves stored under your user app data directory.",
          "Runtime AI through your local Ollama or a Vercel AI Gateway key you enter in app.",
        ]}
      />
    ),
  },
  {
    id: "pick-a-provider",
    title: "Pick a provider",
    body: (
      <>
        <P>You need one. Cupid will not book a date until the AI desk reads ready.</P>
        <DocSubsection id="provider-ollama" title="Option A: Ollama (local, private)">
          <P>
            The local route. Prompts, character data, and date transcripts stay on your machine.
          </P>
          <DocSteps
            items={[
              <span key="install">
                Install Ollama from{" "}
                <a
                  href="https://ollama.com"
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer text-aura-rose underline underline-offset-[4px] hover:text-aura-fuchsia"
                >
                  ollama.com
                </a>
                .
              </span>,
              <span key="chat">
                Pull the chat model. <DocCode>ollama pull gemma4:e4b</DocCode> is the default and
                runs on most 8 to 12 GB GPUs. The catalog inside AI setup lists alternatives for
                compact and large cards.
              </span>,
              <span key="embed">
                Pull the embedding model. <DocCode>ollama pull embeddinggemma</DocCode>.
              </span>,
              <span key="run">
                Make sure Ollama is running. The default port is <DocCode>11434</DocCode>. Cupid
                does not need <DocCode>OLLAMA_ORIGINS</DocCode> because the desktop build talks to
                Ollama through a Tauri HTTP scope, not the browser CORS path.
              </span>,
              <span key="think">
                Reasoning can be enabled in AI setup for local models that support Ollama{" "}
                <DocCode>think</DocCode>. Models without thinking support still answer normally.
              </span>,
            ]}
          />
        </DocSubsection>
        <DocSubsection id="provider-gateway" title="Option B: Vercel AI Gateway (cloud)">
          <P>
            The cloud route. Date prompts, character context, and transcripts are sent through the
            native Vercel AI Gateway endpoint and forwarded to the model provider you choose. Use
            this only if you accept that data leaves your machine.
          </P>
          <DocSteps
            items={[
              "Get a Gateway key from your Vercel project settings.",
              <span key="paste">
                Open AI setup inside the app, switch the desk to Cloud, and paste the key into the
                api key field.
              </span>,
              <span key="storage">
                The key is stored as a plaintext file in app local data on this device, outside save
                files. It is not encrypted and not in the OS keychain. Treat the device as the trust
                boundary. Wiping a save leaves the key in place at runtime, and updating the app
                preserves it. Uninstalling the app wipes the key along with the rest of app data.
                Saving a blank key removes it.
              </span>,
              <span key="reason">
                Gateway reasoning offers <DocCode>none</DocCode>, <DocCode>minimal</DocCode>,{" "}
                <DocCode>low</DocCode>, <DocCode>medium</DocCode>, <DocCode>high</DocCode>, and{" "}
                <DocCode>xhigh</DocCode> where the selected provider accepts those values.
              </span>,
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "provider-ollama", title: "Option A: Ollama (local, private)" },
      { id: "provider-gateway", title: "Option B: Vercel AI Gateway (cloud)" },
    ],
  },
  {
    id: "install",
    title: "Install",
    body: (
      <>
        <DocSubsection id="verify-the-download" title="Verify the download">
          <P>
            Each release lists a SHA256 checksum next to every artifact. Verify before running,
            since the build is unsigned.
          </P>
          <P>Windows PowerShell:</P>
          <DocCodeBlock language="powershell">{`Get-FileHash .\\IDC_<version>_x64-setup.exe -Algorithm SHA256`}</DocCodeBlock>
          <P>macOS terminal:</P>
          <DocCodeBlock language="bash">{`shasum -a 256 IDC_<version>_x64.dmg`}</DocCodeBlock>
          <P>
            Compare the printed value to the one in the release notes. If they differ, do not run
            the file. Ask the team for a fresh link.
          </P>
        </DocSubsection>
        <DocSubsection id="install-windows" title="Windows">
          <DocSteps
            items={[
              "Download the NSIS installer from the release link the team shared.",
              <span key="run">
                Run it. SmartScreen will warn that the publisher is unknown because the build is
                unsigned. Click <Strong>More info</Strong>, then <Strong>Run anyway</Strong>.
              </span>,
              "The installer drops the app into your user profile, no admin prompt.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="install-macos" title="macOS">
          <DocSteps
            items={[
              "Download the DMG or app bundle from the release link.",
              "Drag IDC.app into Applications.",
              <span key="first-run">
                The first launch will be blocked because the build is unsigned. Right click the app,
                choose <Strong>Open</Strong>, and confirm. After the first run the system remembers
                and stops nagging.
              </span>,
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "verify-the-download", title: "Verify the download" },
      { id: "install-windows", title: "Windows" },
      { id: "install-macos", title: "macOS" },
    ],
  },
  {
    id: "first-run",
    title: "First run",
    body: (
      <DocSteps
        items={[
          "Punch in. Cupid issues your badge and seeds the roster.",
          "Open AI setup from the splash hint or the top shell button.",
          <span key="save">
            Pick a provider, fill the fields, and <Strong>Save and verify</Strong>. Wait for the
            readiness check.
          </span>,
          "Once the desk reads ready, pick four focus cases, then book a date from the Live Date screen.",
        ]}
      />
    ),
  },
  {
    id: "where-saves-live",
    title: "Where saves live",
    body: (
      <>
        <DocList
          items={[
            <span key="win">
              Windows: <DocCode>%LOCALAPPDATA%\dev.idc.cupid\saves\</DocCode>
            </span>,
            <span key="mac">
              macOS: <DocCode>~/Library/Application Support/dev.idc.cupid/saves/</DocCode>
            </span>,
          ]}
        />
        <P>
          The save is a JSON file. Wipe it to reset or copy it to back up. Alpha saves are versioned
          to the current build only. When the schema changes, Cupid starts a fresh save instead of
          migrating old files.
        </P>
        <P>
          Gateway key storage lives under the same app local data root in{" "}
          <DocCode>secrets/gateway-api-key.txt</DocCode>. It is not part of the save backup path.
        </P>
      </>
    ),
  },
  {
    id: "uninstall",
    title: "Uninstall",
    body: (
      <DocList
        items={[
          <span key="win">
            <Strong>Windows:</Strong> Settings, Apps, IDC, Uninstall. The uninstaller wipes the
            entire app data directory: saves, logs, Gateway key, and WebView2 cache. Back up{" "}
            <DocCode>%LOCALAPPDATA%\dev.idc.cupid\saves\</DocCode> first if you want to keep a save.
          </span>,
          <span key="mac">
            <Strong>macOS:</Strong> drag IDC.app to Trash. The Application Support directory is
            preserved unless you delete it manually.
          </span>,
        ]}
      />
    ),
  },
  {
    id: "updating",
    title: "Updating",
    body: (
      <>
        <P>
          Cupid checks for updates once after launch. If a signed GitHub release is available, the
          settings button shows an Update badge. Open Settings, Updates, then choose Install.
          Windows shows a passive installer progress window, then the app relaunches.
        </P>
        <P>
          You can also open Settings, Updates, then Check for update at any time. Cupid never
          installs an update without you choosing Install.
        </P>
        <P>
          Updates preserve app local data, including saves and the Gateway key. Alpha saves are
          still schema-bound. If the new build cannot read an older save, Cupid backs it up as a{" "}
          <DocCode>.bak.*</DocCode> file and starts a fresh save.
        </P>
        <P>
          If you are on an older build without Settings updates, download the new installer from the
          shared release link and run it.
        </P>
      </>
    ),
  },
  {
    id: "data-flow",
    title: "Data flow",
    body: (
      <DocList
        items={[
          <span key="local">
            <Strong>Ollama route:</Strong> prompts, character data, and date transcripts stay on the
            machine. Only your Ollama process sees them.
          </span>,
          <span key="gateway">
            <Strong>Gateway route:</Strong> prompts, character context, date transcripts, and any
            retrieved memories are sent to <DocCode>https://ai-gateway.vercel.sh/v3/ai</DocCode> and
            forwarded to the model provider Cupid is configured to use. The Gateway key is the trust
            boundary.
          </span>,
          <span key="saves">
            <Strong>Saves:</Strong> local files. Cupid does not phone home and there is no
            telemetry.
          </span>,
        ]}
      />
    ),
  },
  {
    id: "logs",
    title: "Logs",
    body: (
      <>
        <P>
          The desktop shell writes a rolling log file under your app local data directory. If
          something goes wrong, open Settings, choose <Strong>Show log folder</Strong>, and attach
          the file when reporting the issue.
        </P>
        <P>
          If Cupid shows a crash report screen, choose <Strong>Save bug report</Strong> before
          reloading. The desktop build writes a single JSON report in the log folder with the
          renderer crash report and recent desktop log context attached. Send that generated file
          unless the team asks for the full log folder.
        </P>
        <DocList
          items={[
            <span key="win">
              Windows: <DocCode>%LOCALAPPDATA%\dev.idc.cupid\logs\</DocCode>
            </span>,
            <span key="mac">
              macOS: <DocCode>~/Library/Logs/dev.idc.cupid/</DocCode>
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "known-caveats",
    title: "Known caveats",
    body: (
      <DocCallout variant="warn">
        <DocList
          items={[
            "Unsigned builds. You will see SmartScreen and Gatekeeper warnings until the team ships signed releases.",
            "Custom Ollama or Gateway hostnames are not supported. The desktop HTTP scope is fixed to localhost Ollama and the default Vercel AI Gateway. Custom hosts need a build with an updated scope.",
            "Gateway keys are plaintext on disk under app local data. Anyone with file access on this device can read them. There is no OS keychain integration in the alpha.",
            "The playground route is not present in desktop builds. It only exists in the browser dev shell.",
            "Update checks require access to public GitHub release assets.",
          ]}
        />
      </DocCallout>
    ),
  },
];

export default function DesktopInstallGuideDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
