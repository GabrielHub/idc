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
          "Runtime AI through the On this computer route with local Ollama or the Cloud route with a Vercel AI Gateway key you enter in app.",
        ]}
      />
    ),
  },
  {
    id: "pick-a-provider",
    title: "Pick a provider",
    body: (
      <>
        <P>Pick where dates run. Cupid checks the connection before the first date.</P>
        <DocSubsection id="provider-ollama" title="Option A: On this computer">
          <P>Free and private. Date prompts and transcripts stay on this machine.</P>
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
        <DocSubsection id="provider-gateway" title="Option B: Cloud">
          <P>
            The cloud route. Date prompts, character context, and transcripts are sent through the
            native Vercel AI Gateway endpoint and forwarded to the model provider you choose. Use
            this only if you accept that data leaves your machine.
          </P>
          <DocSteps
            items={[
              "Get a Gateway key from your Vercel project settings.",
              <span key="paste">
                Open AI setup inside the app, choose Cloud, and paste the key into the api key
                field.
              </span>,
              <span key="model">
                The default chat model is <DocCode>deepseek/deepseek-v4-flash</DocCode> with{" "}
                <DocCode>xhigh</DocCode> reasoning. The Cloud selector also exposes{" "}
                <DocCode>deepseek/deepseek-v4-pro</DocCode>,{" "}
                <DocCode>google/gemini-3.1-flash-lite</DocCode>,{" "}
                <DocCode>anthropic/claude-haiku-4.5</DocCode>,{" "}
                <DocCode>minimax/minimax-m2.7</DocCode>, <DocCode>alibaba/qwen3.5-flash</DocCode>,{" "}
                <DocCode>zai/glm-4.7-flash</DocCode>, and <DocCode>openai/gpt-5.4-nano</DocCode>.
              </span>,
              <span key="save">
                Choose <Strong>Save and connect</Strong> to save the setup and run the readiness
                check. If a key is already saved, use <Strong>Check saved key</Strong> to verify it
                without replacing it, or paste a replacement and use{" "}
                <Strong>Check pasted key</Strong>. Changed settings stay pending until Cupid saves
                and verifies the connection.
              </span>,
              <span key="storage">
                The key is stored in the OS credential store on this device, outside save files and
                outside the desktop renderer filesystem scope. Treat the signed app and the device
                account as the trust boundary. Wiping a save leaves the key in place at runtime, and
                updating the app preserves it. Use Remove saved key in AI setup before uninstalling
                if you want Cupid to delete the credential entry.
              </span>,
              <span key="reason">
                Gateway reasoning is locked per model so date behavior stays comparable. DeepSeek V4
                Flash and DeepSeek V4 Pro use <DocCode>xhigh</DocCode>; Gemini 3.1 Flash Lite uses{" "}
                <DocCode>medium</DocCode>; GPT 5.4 Nano uses <DocCode>none</DocCode>; models without
                a stable Gateway reasoning control use <DocCode>off</DocCode>.
              </span>,
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "provider-ollama", title: "Option A: On this computer" },
      { id: "provider-gateway", title: "Option B: Cloud" },
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
          <DocCodeBlock language="bash">{`shasum -a 256 IDC_<version>_universal.dmg`}</DocCodeBlock>
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
              "Download the universal DMG from the release link.",
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
            Pick a provider, fill the fields, and <Strong>Save and connect</Strong>. Wait for the
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
          v0.3.4 intentionally starts fresh from v0.3.3 and older saves. The relationship layer
          moved to a sparse graph (untouched pairs are no longer stored), so older saves cannot be
          read by the current build. The app starts a fresh save on launch and preserves the
          previous save as a backup when it can.
        </P>
        <P>
          Gateway key storage lives in the OS credential store, not the save folder. Current builds
          migrate older plaintext keys from <DocCode>secrets/gateway-api-key.txt</DocCode> into the
          credential store on first read, then remove the plaintext file.
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
            <Strong>Windows:</Strong> Settings, Apps, IDC, Uninstall. The uninstaller wipes app data
            such as saves, logs, and WebView2 cache. The Gateway key is an OS credential entry; use
            Remove saved key in AI setup first if you want Cupid to delete it. Back up{" "}
            <DocCode>%LOCALAPPDATA%\dev.idc.cupid\saves\</DocCode> if you want to keep a save.
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
          Windows shows a passive installer progress window, then the app relaunches. macOS applies
          the signed updater archive, then relaunches the app.
        </P>
        <P>
          You can also open Settings, Updates, then Check for update at any time. Cupid never
          installs an update without you choosing Install.
        </P>
        <P>
          Updates preserve app local data and the OS credential-store Gateway key. Alpha saves are
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
            forwarded to the model provider Cupid is configured to use. The app retrieves the
            Gateway key from the OS credential store when it needs to make those requests.
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
            "Unsigned/ad-hoc signed builds. You will see SmartScreen and Gatekeeper warnings until the team ships fully signed and notarized releases.",
            "Custom Ollama or Gateway hostnames are not supported. The desktop HTTP scope is fixed to localhost Ollama and the default Vercel AI Gateway. Custom hosts need a build with an updated scope.",
            "Gateway keys are stored in the OS credential store, but a compromised renderer or compromised device account can still misuse the key while Cupid is running.",
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
