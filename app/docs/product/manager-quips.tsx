import {
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocDefList,
  DocLink,
  DocList,
  DocPage,
  DocSubsection,
  DocTable,
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
              def: "Lyan. Pre-generated in ElevenLabs Text to Speech with the Eleven v3 model. See the prompting playbook below for stability mode, tag catalog, and worked examples. Files live under public/assets/manager-quips/. Replace draft lines by dropping a recorded file at the matching id.mp3 path.",
            },
            {
              term: "Audio tags",
              def: "Every new line should be authored with at least one Eleven v3 audio tag in generationScript, even if it's a single mood tag at the front. Tags are how Lyan gets her timing, breath, and sarcasm rather than relying on raw text and luck. The full tag taxonomy and the rules for picking them live in the prompting playbook below.",
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
              def: "Occasionally a line slips into another language without warning. Currently Chinese on date.started (两个人，一间房，我去喝杯咖啡 = Two people, one room. I'm going for a coffee.) and Spanish on date.ended (Se acabó. Ahora la parte aburrida: el papeleo. = It's over. Now the boring part: the paperwork.). Keep the meaning self-contained so non-speakers still feel the tone. When you add a foreign line, set the optional translation field on the catalog entry: the preview and the screen-reader announcement render it in parentheses after the line, and ElevenLabs never reads it.",
            },
            {
              term: "Forbidden",
              def: "No em dashes or en dashes in audio scripts. No exclamation marks. No participation-trophy congratulation. No mean-girl cruelty toward the members. The members are sincere; she is just over it.",
            },
          ]}
        />
        <P>
          Variation count scales with trigger frequency. The more often a trigger fires, the more
          variants it needs so the rotation does not stale. Runtime selection prefers variants that
          have not played in the current session and penalizes recently played variants for the same
          trigger before repeating them.
        </P>
        <DocList
          items={[
            <span key="rare">
              <Strong>Rare</Strong> (once per save): one line is enough for triggers that truly only
              fire once, like the onboarding intro. Triggers that are technically rare but can recur
              across saves (member quits, the five-closure soft win) ship two to three so reload
              chatter stays fresh.
            </span>,
            <span key="regular">
              <Strong>Regular</Strong> (multiple per shift): three to five lines depending on how
              hot the trigger is. date.started and date.ended each fire on every committed date, so
              they sit at the high end.
            </span>,
            <span key="episodic">
              <Strong>Episodic</Strong> (mid-shift): three lines for niche cases, up to five for
              triggers the player will bump into a lot (datebook.commit.over-budget is the current
              high end).
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "eleven-v3-playbook",
    title: "Eleven v3 prompting playbook",
    body: (
      <>
        <P>
          Eleven v3 is more expressive than v2 but only when you prompt it like a director. Plain
          prose with no tags gives you a flat reading even with Lyan. Every line in this catalog
          ships a <DocCode>generationScript</DocCode> with at least one tag so the catalog itself
          documents the directed read for each line.
        </P>
        <DocCallout
          variant="info"
          title="The text field is for players, generationScript is for ElevenLabs"
        >
          <P>
            <DocCode>text</DocCode> is what the screen reader announces and what appears in the
            preview row. It must read cleanly without any brackets.{" "}
            <DocCode>generationScript</DocCode> is what you paste into the ElevenLabs Text to Speech
            box. It carries the tags, the ellipses, the capitalized stress words, and any
            spelled-out beats the model needs. The two are siblings, not duplicates: when
            generationScript is omitted the model gets just text, and the result is usually duller
            than it should be.
          </P>
        </DocCallout>
        <DocSubsection id="playbook-stability" title="Stability mode">
          <P>
            Lyan ships with the <Strong>Natural</Strong> stability preset, which keeps her timbre
            consistent and lets tags do their job without straying into hallucination. Bump to{" "}
            <Strong>Creative</Strong> for the very few lines where you want a richer emotional read
            and a small loss of control is acceptable (the onboarding intro is a candidate). Avoid{" "}
            <Strong>Robust</Strong>: it stabilizes the voice but ignores most delivery tags, which
            defeats the point.
          </P>
        </DocSubsection>
        <DocSubsection id="playbook-punctuation" title="Punctuation and stress">
          <DocList
            items={[
              <span key="ellipses">
                <Strong>Ellipses</Strong> (three dots, not an em dash) add weight and a real pause.
                Use them where you want the manager to land a beat. Example:{" "}
                <DocCode>{`Numbers don't math... take something off.`}</DocCode>
              </span>,
              <span key="caps">
                <Strong>ALL CAPS</Strong> on a single word adds spoken emphasis without a tag. Use
                it sparingly, one word per line at most. Example:{" "}
                <DocCode>{`You, NOT we. Fix it.`}</DocCode>
              </span>,
              <span key="commas">
                <Strong>Commas</Strong> create natural breath beats. Comma-splice sentence fragments
                read as conversational; the model handles them well.
              </span>,
              <span key="forbidden">
                <Strong>No em dashes or en dashes anywhere</Strong>, in either field. The model
                interprets them inconsistently and we have a project-wide ban on them. Use commas,
                periods, or ellipses instead.
              </span>,
            ]}
          />
        </DocSubsection>
        <DocSubsection id="playbook-tag-catalog" title="Tag catalog">
          <P>
            Tags are bracketed cues placed inline with the text. They affect the words that follow
            until the next tag or punctuation reset. Lyan is a calibrated voice, so the tags below
            are the ones that read cleanly with her timbre. Accent and sound-effect tags are listed
            for completeness but should be avoided on her clips: she is one character, not a cast,
            and SFX should be added in post if we ever need them.
          </P>
          <DocTable
            headers={["Category", "Tags", "When to reach for it"]}
            rows={[
              [
                "Volume and projection",
                <DocCode key="vol">{`[whispers] [whispering] [quietly] [shouts] [SHOUTING] [emphasized] [stress on next word]`}</DocCode>,
                "Dialing the manager up or down. Whispers land on conspiratorial asides; SHOUTING is reserved for a one-time blow-up and should be paired with caps inside the text.",
              ],
              [
                "Tone",
                <DocCode key="tone">{`[sarcastic] [deadpan] [flatly] [resigned tone] [dramatic tone] [suspicious tone] [casual] [questioning] [understated] [playfully] [cheerfully] [mischievously]`}</DocCode>,
                "Her default register. [casual], [sarcastic], [deadpan], [resigned tone], and [understated] are the workhorses for this character. Skip [cheerfully] and [playfully] unless the line genuinely calls for warmth.",
              ],
              [
                "Emotion",
                <DocCode key="emo">{`[tired] [excited] [nervous] [nervously] [frustrated] [angry] [angrily, fed up] [calm] [awe] [hesitant] [regretful] [curious] [sad] [sorrowful]`}</DocCode>,
                "Use one per line at most. [tired] and [frustrated] fit her baseline; [excited] and [awe] should be rare and earned.",
              ],
              [
                "Non-verbal reactions",
                <DocCode key="nv">{`[sigh] [sighs] [sigh of relief] [clears throat] [gasps] [gulps] [breathes] [laughs] [laughing] [laughs softly] [laughs harder] [light chuckle] [giggle] [big laugh]`}</DocCode>,
                "These actually emit a sound, not just colour the delivery. [sigh] and [light chuckle] are the most useful for her. They are great line openers when you want a beat before she speaks.",
              ],
              [
                "Pacing and pauses",
                <DocCode key="pace">{`[pause] [pauses] [continues after a beat] [rushed] [rapid-fire] [slows down] [drawn out] [deliberate] [stammers] [hesitates] [repeats]`}</DocCode>,
                "Use [pause] or ellipses where a comma would not give you enough room. [drawn out] is good for sarcastic vowels. [rushed] suits over-budget panic. Avoid [stammers] unless the joke is the stammer.",
              ],
              [
                "Multi-speaker (skip for solo Lyan)",
                <DocCode key="multi">{`[interrupting] [overlapping]`}</DocCode>,
                "Useless on single-voice lines. Listed only so nobody tries them on a solo clip.",
              ],
              [
                "Accent / character (avoid)",
                <DocCode key="acc">{`[pirate voice] [French accent] [British accent] [American accent] [Southern US accent]`}</DocCode>,
                "Off-limits for the manager. She is one consistent character with the multilingual quirk handled by simply writing the non-English text directly.",
              ],
              [
                "Sound effects (off-limits inline)",
                <DocCode key="sfx">{`[gunshot] [clapping] [explosion]`}</DocCode>,
                "Do not paste these into a manager script. If a beat ever needs an SFX punctuation, generate it separately and mix in post-production.",
              ],
            ]}
          />
        </DocSubsection>
        <DocSubsection id="playbook-tag-placement" title="Tag placement">
          <DocList
            items={[
              <span key="open">
                Lead with a single tag to set the mood for the whole line:{" "}
                <DocCode>{`[tired] Cut short. Could be efficiency, could be a bailout.`}</DocCode>
              </span>,
              <span key="inline">
                Drop a second tag inline only when the line pivots. Two tags is the comfortable
                ceiling for a one-liner:{" "}
                <DocCode>{`[deadpan] Case closed. [sighs] Somebody else's problem now.`}</DocCode>
              </span>,
              <span key="reaction">
                Open with a non-verbal reaction tag when you want her to physically arrive before
                the words start:{" "}
                <DocCode>{`[light chuckle] The devil's greatest trick was convincing all of you that nuts produce milk.`}</DocCode>
              </span>,
              <span key="cap-tags">
                The capitalized variants of the same tag (e.g. <DocCode>[SHOUTING]</DocCode> vs{" "}
                <DocCode>[shouts]</DocCode>) tend to read stronger. Use the lowercase form by
                default and only escalate if Lyan does not commit.
              </span>,
            ]}
          />
        </DocSubsection>
        <DocSubsection id="playbook-compatibility" title="Tag and voice compatibility">
          <P>
            From the ElevenLabs guidance: "Don't expect a whispering voice to suddenly shout with a{" "}
            <DocCode>[shout]</DocCode> tag." Lyan is mid-range and conversational, so quiet and
            sarcastic tags are reliable, while loud or extreme-emotion tags can come back muted.
            Always preview a tagged script before committing the MP3. If a tag does not land, either
            swap to a related tag, add an ellipsis to give her room, or escalate the stability
            slider to Creative.
          </P>
        </DocSubsection>
        <DocCallout
          variant="note"
          title="Use the Enhance button as a starting point, not a finisher"
        >
          <P>
            The ElevenLabs UI has an <Strong>Enhance</Strong> button that auto-inserts tags based on
            punctuation and content. It is a fine first pass but tends to over-tag, lean cheerful,
            and ignore character context. Treat its output as a starting draft, then cut and replace
            tags until the script matches Lyan's register.
          </P>
        </DocCallout>
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
          run the popup and attempt to play the file. Every catalog entry today is{" "}
          <Strong>recorded</Strong>, pointing at a file under{" "}
          <DocCode>public/assets/manager-quips/</DocCode>. New additions enter as{" "}
          <Strong>draft</Strong>: the copy is approved but the audio file does not exist yet, so the
          preview runs visual only until someone drops in the matching MP3 and flips the status. The
          preview uses the same SFX provider as the game shell, including the shared mute state,
          volume, master gain, and missing-file fallback.
        </P>
        <DocCallout variant="info" title="Graceful degradation by design">
          <P>
            The game does not require an audio file to fire a quip. If the file is missing or
            blocked by the browser, the manager still pops up and the screen-reader line still
            reads. This lets us ship the visual and the trigger flow well before the recording
            sweep.
          </P>
        </DocCallout>
        <DocCallout variant="note" title="generationScript is the canonical intent">
          <P>
            Every catalog entry carries a <DocCode>generationScript</DocCode> that documents the
            directed read for that line: the tags, the stress, the beats. Treat it as the canonical
            recipe for the quip alongside the shipped MP3. New lines are authored against this
            pattern so the next person to extend the catalog has a consistent reference to work
            from.
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
          The audio pass is produced manually in ElevenLabs Text to Speech. Settings: Eleven v3
          model, Lyan voice, Natural stability by default. The game ships the exported MP3 files and
          never calls ElevenLabs at runtime.
        </P>
        <DocCallout variant="info" title="ElevenLabs references">
          <P>
            See the prompting playbook above for the in-game canon. The upstream references are:{" "}
            <DocLink to="https://elevenlabs.io/docs/best-practices/prompting/eleven-v3">
              Prompting Eleven v3
            </DocLink>
            ,{" "}
            <DocLink to="https://help.elevenlabs.io/hc/en-us/articles/35869142561297-How-do-audio-tags-work-with-Eleven-v3">
              ElevenLabs audio tags help
            </DocLink>
            , and{" "}
            <DocLink to="https://elevenlabs.io/blog/v3-audiotags">
              What are Eleven v3 Audio Tags
            </DocLink>
            . Tag behavior depends on the voice, so test every tagged line with Lyan before
            committing the MP3.
          </P>
        </DocCallout>
        <P>
          A tagged script looks like the lines below. The bracketed cues stay in{" "}
          <DocCode>generationScript</DocCode>; the cleaned display copy stays in{" "}
          <DocCode>text</DocCode>.
        </P>
        <DocCodeBlock language="text">{`[tired] [sighs] Okay. Filing that under tried.
[sarcastic] Fantastic... a budget crisis with stationery.
[whispers] If anyone asks, I was never here.
[light chuckle] Case closed. [deadpan] Nobody tell finance.`}</DocCodeBlock>
        <DocList
          items={[
            <span key="draft">
              Draft the display line in <DocCode>text</DocCode>, then write the directed version in{" "}
              <DocCode>generationScript</DocCode>. Every new entry needs both fields, even if the
              script is just a single leading mood tag plus the same words.
            </span>,
            <span key="generate">
              Paste <DocCode>generationScript</DocCode> into ElevenLabs Text to Speech with model{" "}
              <DocCode>eleven_v3</DocCode>, Lyan voice, and Natural stability (Creative for the rare
              lines that need extra range). Audition two or three takes before exporting.
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
              <Strong>Draft.</Strong> Write the display line against the rules above. Keep it under
              fourteen words. Read it out loud in the Lyan voice. If it does not sound like a memo's
              closing line, rewrite.
            </span>,
            <span key="direct">
              <Strong>Direct.</Strong> Write the tagged version next to it. Lead with one mood or
              reaction tag (<DocCode>[tired]</DocCode>, <DocCode>[sigh]</DocCode>,{" "}
              <DocCode>[sarcastic]</DocCode>, etc.), drop a second tag inline only where the line
              pivots, and use ellipses or ALL CAPS for stress. See the prompting playbook above for
              the full tag catalog.
            </span>,
            <span key="register">
              <Strong>Register.</Strong> Add an entry to <DocCode>MANAGER_QUIP_CATALOG</DocCode> in{" "}
              <DocCode>app/fixtures/manager-quips.ts</DocCode> with both <DocCode>text</DocCode> and{" "}
              <DocCode>generationScript</DocCode> populated. Set <DocCode>status: "draft"</DocCode>{" "}
              until audio exists.
            </span>,
            <span key="trigger">
              <Strong>Pick a trigger.</Strong> Reuse an existing{" "}
              <DocCode>ManagerQuipTriggerKey</DocCode> when possible. New triggers must be added to
              the <DocCode>MANAGER_QUIP_TRIGGER_GROUPS</DocCode> table with a cadence (rare,
              regular, episodic) and wired into the shell-local dispatcher.
            </span>,
            <span key="record">
              <Strong>Record.</Strong> Paste <DocCode>generationScript</DocCode> into ElevenLabs
              Text to Speech using Eleven v3, Natural stability, and the Lyan voice. Save the file
              at the path stored in the catalog entry. Flip the entry status to{" "}
              <Strong>recorded</Strong>.
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
