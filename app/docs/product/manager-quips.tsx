import {
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocDefList,
  DocLink,
  DocList,
  DocPage,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";
import { ManagerQuipLibrary } from "../../components/manager-quip-preview";

export const meta: DocMeta = {
  slug: "product/manager-quips",
  group: "product",
  title: "Manager check-in quips",
  description:
    "The manager standee, her voice, the trigger catalog, and the rules for adding new lines.",
  order: 9,
};

export const lede = (
  <>
    The manager is the only character who speaks to the player directly. Members live inside the
    simulation and talk to each other; she stands on the operator's side of the screen. She started
    as the tutorial guide. After onboarding she stays in the build as a sparse reactive companion,
    rising from below the viewport at named gameplay beats with a single voiced sentence, then
    dropping back down. This doc is the canon for her appearance, her voice, and every line she
    ships with.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "appearance",
    title: "Appearance",
    body: (
      <>
        <P>
          She is a standee. The manager portrait is anchored to the bottom of the viewport and pops
          in from a corner with a spring. Only her top half (head, shoulders, chest) sits inside the
          visible stage. Her legs are below the screen edge. The implication is that someone is
          shoving her up from offstage.
        </P>
        <DocList
          items={[
            <span key="scale">
              <Strong>Scale.</Strong> Roughly the same body scale as the date-stage standees in{" "}
              <DocCode>app/components/date-reactions.tsx</DocCode>. Generous, character-sized. The
              corner placement is where she rises from, not a shrink.
            </span>,
            <span key="anchor">
              <Strong>Anchor.</Strong> Bottom-left or bottom-right corner, picked randomly per quip
              with no immediate repeats. Surfaces with a primary CTA in one of those corners skip
              that side so she never covers the button.
            </span>,
            <span key="motion">
              <Strong>Motion.</Strong> Springs in from offscreen at the chosen corner, tilted toward
              the screen center (entry around 22 degrees, settling near 7). Stays tilted while she
              talks, with a continuous gentle bob, sway, and drift so she never freezes. Springs
              back the way she came on auto-dismiss. No popsicle stick, no speech bubble, no card.
            </span>,
            <span key="duration">
              <Strong>Duration.</Strong> She stays on screen for roughly the audio length plus a
              short buffer. The catalog target is one or two sentences per line, three to five
              seconds of audio.
            </span>,
          ]}
        />
        <DocCallout variant="note" title="Why no speech bubble">
          <P>
            The audio carries the text. Adding a bubble makes her redundant and pulls focus to
            reading instead of listening. Players with the audio muted simply see her appear and go,
            which still reads as a beat acknowledgement. A screen-reader-only string carries the
            line for accessibility.
          </P>
        </DocCallout>
      </>
    ),
  },
  {
    id: "voice",
    title: "Voice and authoring rules",
    body: (
      <>
        <P>
          She is the HR manager running a supernatural matchmaking agency, ten years deep. Laid
          back, a little tired, comfortable with sarcasm. Dry wit, not punchlines. She has done this
          enough times that nothing surprises her, and she stopped pretending otherwise. Each line
          should read like the throwaway aside of a coworker who is half-watching the monitor while
          she finishes her coffee.
        </P>
        <DocDefList
          items={[
            {
              term: "Voice (ElevenLabs)",
              def: "Lyan. Pre-generated in ElevenLabs Text to Speech with the Eleven v3 model and Natural stability. Files live under public/assets/manager-quips/. Replace draft lines by dropping a recorded file at the matching id.mp3 path.",
            },
            {
              term: "Audio tags",
              def: "Future recording scripts should use Eleven v3 tags when delivery matters. Prefer bracketed directions such as [sighs], [whispers], [sarcastic], or [light chuckle] inline with the spoken text. Keep the display text clean, and put the tagged script in generationScript when it differs from the line players see.",
            },
            {
              term: "Length",
              def: "One sentence, two at most. Five to twelve words. Three to five seconds of audio. Short fragments are fine when the delivery carries them. The onboarding.welcome line is the lone exception, an intentional longer intro that runs ten to fifteen seconds because it pairs with the very first coach mark.",
            },
            {
              term: "Register",
              def: "Spoken, not written. Contractions, sentence fragments, casual filler (yeah, okay, cool) are welcome. Office words still anchor her (file, log, archive, cap, books) but they sit inside conversational rhythm, not memo grammar.",
            },
            {
              term: "Subject",
              def: "She talks to the player directly when sarcasm needs a target, and about the pair when commenting on the work. Use whichever lands the line. The old avoid-you rule is retired.",
            },
            {
              term: "Multilingual quirk",
              def: "Roughly one line in ten slips into another language without warning. Currently Chinese on date.started (两个人，一间房，我去喝杯咖啡 = Two people, one room. I'm going for a coffee.) and Spanish on date.ended (Se acabó. Ahora la parte aburrida: el papeleo. = It's over. Now the boring part: paperwork.). Keep the meaning self-contained so non-speakers still feel the tone. When you add a foreign line, set the optional translation field on the catalog entry: the preview and the screen-reader announcement render it in parentheses after the line, and ElevenLabs never reads it.",
            },
            {
              term: "Forbidden",
              def: "No em dashes or en dashes in audio scripts. No exclamation marks. No participation-trophy congratulation. No mean-girl cruelty toward the members. The members are sincere; she is just over it.",
            },
          ]}
        />
        <P>
          Variation count scales with trigger frequency. The more often a trigger fires, the more
          variants it needs so the rotation does not stale.
        </P>
        <DocList
          items={[
            <span key="rare">
              <Strong>Rare</Strong> (once per save): one line is enough. The saved presentation log
              keeps it from replaying after reloads.
            </span>,
            <span key="regular">
              <Strong>Regular</Strong> (multiple per shift): two to five lines depending on how hot
              the trigger is. date.started and date.ended each fire on every committed date, so they
              sit at the high end.
            </span>,
            <span key="episodic">
              <Strong>Episodic</Strong> (mid-shift): two to three lines is the sweet spot.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "catalog",
    title: "The catalog",
    body: (
      <>
        <P>
          Every shipped line is listed here, grouped by trigger. Click the play button on a row to
          run the popup and attempt to play the file. Lines marked <Strong>draft</Strong> have copy
          approved but no audio file yet, so the preview runs visual only. Lines marked{" "}
          <Strong>recorded</Strong> point at a file under{" "}
          <DocCode>public/assets/manager-quips/</DocCode>. The preview uses the same SFX provider as
          the game shell, including the shared mute state, volume, master gain, and missing-file
          fallback.
        </P>
        <DocCallout variant="info" title="Graceful degradation by design">
          <P>
            The game does not require an audio file to fire a quip. If the file is missing or
            blocked by the browser, the manager still pops up and the screen-reader line still
            reads. This lets us ship the visual and the trigger flow well before the recording
            sweep.
          </P>
        </DocCallout>
        <ManagerQuipLibrary />
      </>
    ),
  },
  {
    id: "implementation-contract",
    title: "Implementation contract",
    body: (
      <>
        <P>
          Manager quips are presentation only. They react to gameplay events after those events have
          already been validated and persisted. They do not change Date Health, member mood, pair
          stats, memories, scoring, prompts, or runtime AI context.
        </P>
        <DocDefList
          items={[
            {
              term: <DocCode>app/fixtures/manager-quips.ts</DocCode>,
              def: "Owns trigger groups and the catalog: id, triggerKey, display text, optional translation, optional generationScript, audio path, and recorded or draft status.",
            },
            {
              term: <DocCode>app/domain/game.ts</DocCode>,
              def: "Owns managerQuipHistory as a presentation log on GameSave. Old saves default to an empty log. The log is not gameplay repair and is not read by runtime AI.",
            },
            {
              term: <DocCode>app/services/manager-quips.ts</DocCode>,
              def: "Pure resolver and diff helpers. Rare triggers fire once per save. Regular triggers dedupe each trigger once per shift. Episodic triggers dedupe by surface key so the same blocked surface does not chatter.",
            },
            {
              term: <DocCode>app/components/cupid-shell.tsx</DocCode>,
              def: "Owns the dispatcher. Existing shell handlers call it after successful persistence. No global event bus. Quips are suppressed while a required tutorial step is active, with one exception: onboarding.welcome passes bypassTutorialGate so it can voice the agency intro alongside the very first coach mark.",
            },
            {
              term: <DocCode>app/components/sfx-provider.tsx</DocCode>,
              def: "Owns playVoiceClip(path). Voice clips load as static MP3 assets, pass through the shared SFX volume and mute path, and resolve silently when the file is missing, blocked, or undecodable.",
            },
            {
              term: <DocCode>app/components/manager-quip-popup.tsx</DocCode>,
              def: "Owns the runtime standee popup. It mounts fixed to the bottom of the viewport, chooses a corner, plays the recorded clip when possible, then auto-dismisses after the clip or a visual fallback timer.",
            },
          ]}
        />
      </>
    ),
  },
  {
    id: "production-process",
    title: "Production process",
    body: (
      <>
        <P>
          The current audio pass was produced manually in ElevenLabs Text to Speech. The settings
          used for the shipped manager clips were: Eleven v3 model, Natural stability, Lyan voice,
          and inline audio tags in the generation scripts. The game ships the exported MP3 files and
          never calls ElevenLabs at runtime.
        </P>
        <DocCallout variant="info" title="Eleven v3 tag format">
          <P>
            ElevenLabs documents audio tags as square-bracket delivery directions interpreted by
            Eleven v3. The official prompting guide notes that tag behavior depends on the selected
            voice, so test every tagged line with Lyan before committing an asset. Keep these
            references handy:{" "}
            <DocLink to="https://elevenlabs.io/docs/best-practices/prompting">
              Eleven v3 prompting guide
            </DocLink>{" "}
            and{" "}
            <DocLink to="https://help.elevenlabs.io/hc/en-us/articles/35869142561297-How-do-audio-tags-work-with-Eleven-v3-Alpha">
              ElevenLabs audio tags help
            </DocLink>
            .
          </P>
        </DocCallout>
        <DocCodeBlock language="text">{`[sighs] Okay. Filing that under tried.
[sarcastic] Fantastic. A budget crisis with stationery.
[whispers] If anyone asks, I was never here.
[light chuckle] Case closed. Nobody tell finance.`}</DocCodeBlock>
        <DocList
          items={[
            <span key="draft">
              Draft the display line first in <DocCode>text</DocCode>. If the recording needs
              direction, add the ElevenLabs script to <DocCode>generationScript</DocCode> so copy
              review can see the exact tagged input.
            </span>,
            <span key="generate">
              Generate in ElevenLabs Text to Speech with model <DocCode>eleven_v3</DocCode>, Lyan
              voice, and Natural stability. Keep the tagged script short enough that the line still
              lands in three to five seconds.
            </span>,
            <span key="export">
              Export MP3, save it under <DocCode>public/assets/manager-quips/</DocCode> using the
              catalog id as the filename, then set <DocCode>status</DocCode> to{" "}
              <DocCode>recorded</DocCode>.
            </span>,
            <span key="preview">
              Open this doc, unmute the shared SFX controls if needed, and play the row. Check that
              the standee appears, the clip plays at a sane level, mute stops audio, and the line
              still reads correctly with audio off.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "adding-a-quip",
    title: "Adding a quip",
    body: (
      <>
        <P>
          New lines go through three steps: draft, register, record. The first two are code, the
          third is asset work.
        </P>
        <DocList
          items={[
            <span key="draft">
              <Strong>Draft.</Strong> Write the line against the rules above. Keep it under fourteen
              words. Read it out loud in the Lyan voice. If delivery tags are needed, add the tagged
              ElevenLabs input to <DocCode>generationScript</DocCode>. If it does not sound like a
              memo's closing line, rewrite.
            </span>,
            <span key="register">
              <Strong>Register.</Strong> Add an entry to <DocCode>MANAGER_QUIP_CATALOG</DocCode> in{" "}
              <DocCode>app/fixtures/manager-quips.ts</DocCode>. Set{" "}
              <DocCode>status: "draft"</DocCode> until audio exists.
            </span>,
            <span key="trigger">
              <Strong>Pick a trigger.</Strong> Reuse an existing{" "}
              <DocCode>ManagerQuipTriggerKey</DocCode> when possible. New triggers must be added to
              the <DocCode>MANAGER_QUIP_TRIGGER_GROUPS</DocCode> table with a cadence (rare,
              regular, episodic) and wired into the shell-local dispatcher.
            </span>,
            <span key="record">
              <Strong>Record.</Strong> Generate the audio in ElevenLabs Text to Speech using Eleven
              v3, Natural stability, and the Lyan voice. Save the file at the path stored in the
              catalog entry. Flip the entry status to <Strong>recorded</Strong>.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "cross-references",
    title: "Cross references",
    body: (
      <>
        <P>The systems behind the curtain live in other docs. Use these to wire new triggers.</P>
        <DocList
          items={[
            <span key="tutorial">
              The tutorial system that introduced the manager portrait is documented in{" "}
              <DocLink to="/docs/product/tutorial-system">Tutorial system</DocLink>. Quips are
              suppressed while a required tutorial step is on screen.
            </span>,
            <span key="voice">
              The broader voice and tone canon for the game lives in{" "}
              <DocLink to="/docs/product/voice">Voice</DocLink>. The manager fingerprint should link
              back here when it lands there.
            </span>,
            <span key="audio">
              The web audio service that plays the clips lives in{" "}
              <DocCode>app/components/sfx-provider.tsx</DocCode>. The preview controls on this page
              call the same SFX provider used by the game settings menu.
            </span>,
          ]}
        />
      </>
    ),
  },
];

export default function ManagerQuipsProductDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
