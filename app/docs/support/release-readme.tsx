import {
  DocCallout,
  DocCode,
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
  slug: "support/release-readme",
  group: "support",
  title: "Alpha install notes",
  description:
    "Short, player-facing install card for a GitHub prerelease asset. Unsigned, alpha, one AI provider required.",
  order: 1,
};

export const lede = (
  <>
    IDC is a private alpha desktop game. The app is unsigned for now, so Windows or macOS may warn
    you before opening it. Read this card before you double click anything.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "what-to-download",
    title: "What to download",
    body: (
      <DocList
        items={[
          <span key="win">
            Windows: download <DocCode>IDC_&lt;version&gt;_x64-setup.exe</DocCode>.
          </span>,
          <span key="mac">
            macOS: download the <DocCode>.dmg</DocCode> or <DocCode>.app</DocCode> build if one is
            listed for this release.
          </span>,
          <span key="extras">
            You do not need the source code, <DocCode>latest.json</DocCode>, <DocCode>.sig</DocCode>
            , or <DocCode>.sha256</DocCode> files unless the team asks for them.
          </span>,
        ]}
      />
    ),
  },
  {
    id: "install",
    title: "Install",
    body: (
      <>
        <DocSubsection id="install-windows" title="Windows">
          <DocSteps
            items={[
              <span key="run">
                Run <DocCode>IDC_&lt;version&gt;_x64-setup.exe</DocCode>.
              </span>,
              <span key="smartscreen">
                If Windows SmartScreen says the publisher is unknown, choose{" "}
                <Strong>More info</Strong>, then <Strong>Run anyway</Strong>.
              </span>,
              "Open IDC from the Start menu.",
              <span key="punch">
                Click <Strong>Clock in</Strong>.
              </span>,
              <span key="ai">
                Open <Strong>AI setup</Strong> when prompted and choose either local Ollama or Cloud
                Gateway.
              </span>,
            ]}
          />
        </DocSubsection>
        <DocSubsection id="install-macos" title="macOS">
          <DocSteps
            items={[
              <span key="dmg">
                Open the downloaded <DocCode>.dmg</DocCode> or app bundle.
              </span>,
              "Drag IDC into Applications if prompted.",
              <span key="gatekeeper">
                On first launch, macOS may block the app because it is unsigned. Right click IDC,
                choose <Strong>Open</Strong>, then confirm.
              </span>,
              <span key="punch">
                Click <Strong>Clock in</Strong>.
              </span>,
              <span key="ai">
                Open <Strong>AI setup</Strong> when prompted and choose either local Ollama or Cloud
                Gateway.
              </span>,
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "install-windows", title: "Windows" },
      { id: "install-macos", title: "macOS" },
    ],
  },
  {
    id: "ai-setup",
    title: "AI setup",
    body: (
      <>
        <P>IDC needs one AI provider before you can book dates.</P>
        <DocList
          items={[
            <span key="local">
              <Strong>Local:</Strong> install Ollama, keep it running, and ask the team which model
              to pull for this build.
            </span>,
            <span key="cloud">
              <Strong>Cloud:</Strong> use a Vercel AI Gateway key from the team or your own Vercel
              project.
            </span>,
          ]}
        />
        <P>The app does not include a no-AI date mode.</P>
      </>
    ),
  },
  {
    id: "updating",
    title: "Updating",
    body: (
      <>
        <P>
          IDC checks for updates after launch. If an update appears in Settings, choose{" "}
          <Strong>Install</Strong> when you are ready. Your local saves should stay in place when
          updating.
        </P>
        <P>
          After an update, IDC opens a <Strong>What's new</Strong> modal with the current patch
          notes and a few recent versions. You can reopen it from Settings.
        </P>
        <DocCallout variant="warn">
          If update install fails, download the newest installer from the release page and run it.
        </DocCallout>
      </>
    ),
  },
  {
    id: "getting-help",
    title: "Getting help",
    body: (
      <>
        <P>If the app shows an error, send the team:</P>
        <DocSteps
          items={[
            "A screenshot of the error.",
            "What you clicked right before it happened.",
            "Your provider choice: Ollama or Cloud Gateway.",
          ]}
        />
        <P>
          If the app shows a crash report screen, choose <Strong>Save bug report</Strong> and send
          the generated JSON file. In IDC, open Settings and choose <Strong>Show log folder</Strong>{" "}
          only if the team asks for full logs.
        </P>
        <P>
          For the full install guide, see{" "}
          <DocLink to="/docs/support/desktop-install-guide">Desktop install guide</DocLink>.
        </P>
      </>
    ),
  },
];

export default function ReleaseReadmeDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
