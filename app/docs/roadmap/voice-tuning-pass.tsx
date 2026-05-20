import {
  DocCallout,
  DocCode,
  DocLink,
  DocList,
  DocPage,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";
import {
  RoadmapAcceptance,
  RoadmapChecklist,
  RoadmapDecisionsLog,
  RoadmapFileRef,
  RoadmapPlanHeader,
} from "../../components/roadmap-primitives";
import type { RoadmapPlanMeta } from "../../services/roadmap-content";

const slug = "roadmap/voice-tuning-pass";

export const meta: DocMeta = {
  slug,
  group: "roadmap",
  title: "Roster voice tuning pass",
  description:
    "One audit per member, walked in curated roster order. Each member is read live through the AI character pipeline, then fixture or prompt fixes land before the next member is queued. The lock bar is an entertaining scene, not mere compliance.",
  order: 12,
};

export const plan: RoadmapPlanMeta = {
  status: "in-flight",
  opened: "2026-05-16",
  touched: "2026-05-20",
  owner: "gabriel",
  tldr: "Walk every member in the onboarding-screen curated order, run live tune sessions, lock only when the scene is funny and interesting to read, then queue the next member. Out-of-order tunes are allowed but tracked here.",
  tasks: 42,
  done: 33,
  tags: ["voice", "fixtures", "audit"],
};

export const lede = (
  <>
    The onboarding screen ranks members through{" "}
    <RoadmapFileRef path="app/services/member-roster-order.ts" />, not alphabetically. This plan
    walks that exact order so we never lose track of who has been audited, and so out-of-order tunes
    are visible.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "context",
    title: "Context",
    body: (
      <>
        <RoadmapPlanHeader slug={slug} plan={plan} />
        <P>
          Member fixtures are being voice-tuned one at a time. Each pass reads the fixture and
          reference docs, runs a live <DocCode>vp run tune</DocCode> session against the AI
          character pipeline, surfaces issues (caricature, profile chase, prescriptive prompt
          leakage, opaque dimensional references, boring exchanges), and lands fixture or prompt
          fixes before the next member is queued.
        </P>
        <P>
          The order is the curated roster order in{" "}
          <RoadmapFileRef path="app/services/member-roster-order.ts" />, which the onboarding screen
          and roster canvas use through{" "}
          <RoadmapFileRef path="app/services/member-roster-filter.ts" />. It is not alphabetical.
          When this plan diverges from order (because we deliberately tuned a later member first),
          the checklist still records the actual completed state so the queue stays honest.
        </P>
        <DocCallout variant="info" title="Cassia Six is present">
          <P>
            Verified Cassia Six sits at curated position 35 (between Cha Yusung and Nawal Marrash).
            No insertion required.
          </P>
        </DocCallout>
        <DocCallout variant="warn" title="Out-of-order tunes are flagged">
          <P>
            Gideon Glass (position 9), Imani Wallace (position 13), and Idris Mahari (position 39)
            were tuned ahead of the cursor. All locked at fixture level. The next sequential entry
            is curated position 33, Derek Halsey.
          </P>
        </DocCallout>
      </>
    ),
  },
  {
    id: "per-member-procedure",
    title: "Per-member procedure",
    body: (
      <>
        <P>
          Each member task represents one full audit cycle. The cycle ends only when the user
          confirms the voice is locked. A technically compliant transcript is not locked if the date
          is flat, dutiful, or a slog to read.
        </P>
        <DocCallout variant="warn" title="Entertainment is the product bar">
          <P>
            Character interaction is the core game loop. Every tune transcript should read like a
            good comedy scene: each member wants something, each line gives the other person
            something alive to play, and the exchange builds through surprise, friction,
            specificity, or warmth. Correct canon and clean prompt behavior are table stakes. The
            lock bar is that the scene is interesting, funny, and worth reading.
          </P>
        </DocCallout>
        <DocList
          items={[
            <span key="read-fixture">
              Read <DocCode>app/fixtures/members/&lt;id&gt;.ts</DocCode> end to end. Note bio,
              register, tics, sample buckets, dealbreakers, dating profile.
            </span>,
            <span key="personality-foreground">
              <Strong>
                Audit the bio for the personality-foreground / hobby-background contract.
              </Strong>{" "}
              Personality traits and quirks belong in the foreground as state claims that describe
              who the character IS at the table (debater-first-listener-second; loud-by-default-
              without-noticing; here-for-the-one; arrives-early-leaves-honest). Hobbies, interests,
              environments, and reference catalogs belong in the background as palette the LLM can
              freestyle off of without those topics owning the character. Mixing them collapses the
              character into single-point-of-interest fixation; separating them produces a defined
              personality with the ability to reach into a variety of topics without becoming any
              one of them. Same rule applies to sample banks: embody personality through action,
              energy, takes, and substance, not through trait recital (no "im picky" / "im loud" /
              "ill call an early read" stacked as introductory disclosure). Filing-trade voices
              (audit, deposition, brand relay, on-the-record) and brand-performing voices are the
              canonical exception because their characters are canonically performing; everyone else
              cuts self-announcement. See the 2026-05-18 decisions for the Alex Yoon precedent and
              the cross-cutting application to the rest of the roster.
            </span>,
            <span key="read-docs">
              Cross-check{" "}
              <DocLink to="/docs/product/voice-fingerprints">Voice fingerprints</DocLink>,{" "}
              <DocLink to="/docs/product/voice-prompts">Voice prompts</DocLink>,{" "}
              <DocLink to="/docs/gameplay/member-fields-and-tags">
                Member fields and hidden tags
              </DocLink>
              , and this plan's decisions log for any contract this member needs to honor.
            </span>,
            <span key="read-prompt-eng">
              Before editing anything inside <RoadmapFileRef path="app/services/date-prompts.ts" />{" "}
              or other LLM prompt builders, re-read the project prompt contracts in{" "}
              <DocLink to="/docs/product/voice-prompts">Voice prompts</DocLink>. For systemic prompt
              rewrites, also consult the official prompt engineering guides linked in the References
              section below. Every prompt edit goes through these principles: positive framing,
              context first, outcome over process, reserve absolutes for true invariants, let the
              model decide behavior.
            </span>,
            <span key="pick-partners">
              Pick two partners from the roster for this focus member: a{" "}
              <Strong>warm pairing</Strong> (tag overlap, complementary register, no dealbreaker
              triggers, preferences that line up) and a <Strong>boundary-pressure pairing</Strong>{" "}
              (a partner whose default voice and likely behavior can plausibly press one or more of
              the focus member's guards, dealbreakers, or private pressures). Justify both picks in
              a sentence with the fixture evidence. The pressure transcript does not have to force
              an early ending; a believable cool-down, clean refusal, redirect, or dignified walkout
              can all be the correct read.
            </span>,
            <span key="spawn-subagents">
              For each pairing, run a fresh named tune session. If parallel work helps, a worker
              subagent may play the partner side and own that session end to end: it runs{" "}
              <DocCode>
                vp run tune -- start &lt;focus-id&gt; --partner &lt;partner-id&gt; --name
                &lt;session-name&gt; --focus-opens
              </DocCode>
              , authors each <DocCode>say</DocCode> line, and returns the transcript. If running the
              session locally, follow the same named-session rule. Pass{" "}
              <DocCode>--session &lt;session-name&gt;</DocCode> on every command after start so
              parallel pairings cannot collide on the shared{" "}
              <DocCode>.claude-tmp/tune/active.txt</DocCode> pointer. Feed the partner player the
              partner's fixture content (bio, dating profile, register, tics, sample messages,
              dealbreakers, refused patterns), the focus member's name, the scenario, and the
              partner-play rules in{" "}
              <DocLink to="/docs/product/voice-prompts">Voice prompts</DocLink> plus this plan's
              decisions log: stay strictly in the partner's voice, do not become a question-machine,
              do not blur professions, respect tics-as-seasoning, and respect IDC venue and transit
              canon. Neither member chose the place, Cupid did, and members arrive via Cupid Transit
              by car-gate-flash, not by local transit. Do not let the subagent improvise outside the
              partner's documented voice, and do not let the partner's first speaking line credit
              the focus member for the venue, the time, the route, or the match itself.{" "}
              <Strong>
                Sample partner lines pre-drafted by the audit driver are not a substitute for the
                partner's fixture.
              </Strong>{" "}
              The subagent must read <DocCode>app/fixtures/members/&lt;partner-id&gt;.ts</DocCode>{" "}
              directly, pull lines from the partner's actual sample bank where possible, and
              improvise in the partner's documented voice for trigger pushes the bank does not
              cover. Tags ("contemporary," "performative," "career_focused") are filing metadata,
              not voice descriptions; do not import a stereotype from the tag set. If the driver
              gives the subagent suggested partner lines as a starting point, those lines are a
              draft to verify against the fixture, not a license to skip the fixture read. With{" "}
              <DocCode>--focus-opens</DocCode> the partner's first line is their reply to the
              focus's greeting, but it still becomes load-bearing context for the focus's subsequent
              turns and a canon violation in that reply contaminates the rest of the transcript the
              same way an opener would. The partner-played lines must also be entertaining:
              specific, responsive, and alive enough to give the focus member a scene partner
              instead of a compliance test. For boundary-pressure audits, apply{" "}
              <DocCode>
                tune judge -&lt;n&gt; --note "&lt;reason&gt;" --session &lt;name&gt;
              </DocCode>{" "}
              snapshots between turns after clear guard or dealbreaker landings, when the transcript
              has earned that pressure. Date Health below 65 starts feeding crashingOut samples
              after the opening turn, below 40 makes cooling dominant, and below 15 maxes the crash
              bucket. Use those bands to expose the voice bank, not to force a collapse the scene
              has not earned.
            </span>,
            <span key="review-transcripts">
              Read both returned transcripts. The warm transcript verifies engagement, hobby
              reveals, two-stage tics, chemistry, and whether the conversation is fun to read. The
              boundary-pressure transcript verifies cooling and crashing-out sample voices when the
              date earns them, that guards and dealbreakers fire cleanly, and that the focus member
              cools, refuses, redirects, or ends the date with dignity.{" "}
              <Strong>
                Every transcript is a two-member audit. The partner side is also a curated member
                with a fixture and an authored voice; their lines drift the same way the focus's
                can.
              </Strong>{" "}
              Read both speakers when reviewing the window. If the partner shows a voice issue
              (self-announcement antipattern, leaked prescription, scaffolded-AI shapes, profile
              recital, register flattening, hobby-foregrounding, partner-mirror collapse, anti-
              pattern punctuation), do not silently absorb it as background, and do not save it for
              that member's own future audit. Note it in the audit summary. If the issue is
              unambiguous and the fix is surgical, apply the partner-side fix in this pass and
              re-run the affected pairing. If the issue is character-architectural or needs its own
              session to resolve cleanly, queue it as a follow-up on that member's roster entry so
              the future audit starts from the surfaced finding rather than re-discovering it.{" "}
              <Strong>
                Surface a readable transcript window to the user for every baseline and final-lock
                test: a contiguous span of up to six focus-member turns per pairing, with the
                partner lines that prompted them, inside fenced code blocks, each line numbered and
                labeled by speaker first name. The window must read as a real conversation, not
                cherry-picked highlights stitched with ellipses. If the session ran six or fewer
                focus turns, surface the whole session
              </Strong>{" "}
              so the user can catch missed voice errors without reading a full session dump. For
              retests between baseline and final lock, summarize the failure and include only the
              relevant contiguous excerpt unless the user asks for the full transcript. The
              observation note follows the transcript, never replaces it.
            </span>,
            <span key="flag-fix">
              Flag caricature, leaked prescription, opaque dimensional reference, profile-chase
              loops, profile-mirror leakage, or anti-pattern punctuation. Fix at the smallest
              correct surface: fixture line, shared prompt scaffold, or systemic helper.
            </span>,
            <span key="retest-lock">
              Retest after each fix until the user confirms the voice is locked. Mark the checklist
              entry done only after the transcript is in voice, canon-safe, and entertaining.
            </span>,
            <span key="update-plan-live">
              <Strong>Update this plan before moving to the next member.</Strong> Set the locked
              entry's <DocCode>defaultDone: true</DocCode> with a short suffix note, bump{" "}
              <DocCode>plan.done</DocCode> and <DocCode>plan.touched</DocCode> in the header, and
              add any systemic fix to the decisions log below with the file references. The plan is
              the queue of record; the cursor only stays honest if the file is edited the moment a
              lock happens.
            </span>,
            <span key="verify">
              After fixture or prompt edits, run <DocCode>vp check</DocCode>. Run{" "}
              <DocCode>vp test</DocCode> and <DocCode>vp build</DocCode> when the change touches
              runtime behavior, prompt scaffolds, fixtures, systems, saves, integration, or
              user-facing workflows. Fix failures before the member is locked unless the user
              explicitly says parallel work owns the breakage.
            </span>,
          ]}
        />
        <DocCallout variant="info" title="Prompt-level fixes propagate">
          <P>
            A change inside <RoadmapFileRef path="app/services/date-prompts.ts" /> can shift the
            voice of every member tuned after that point. When a fix is systemic, note it in the
            decisions log so later members are not retuned around an old baseline, and flag earlier
            locked members for spot-check.
          </P>
        </DocCallout>
      </>
    ),
  },
  {
    id: "references",
    title: "References",
    body: (
      <>
        <P>
          Reference reading before systemic edits to any IDC LLM prompt builder. The source guides
          are listed here so the principles can be re-derived from authority instead of paraphrased
          from memory. Routine fixture tuning should use the project-specific contract in{" "}
          <DocLink to="/docs/product/voice-prompts">Voice prompts</DocLink> and this plan's
          decisions log.
        </P>
        <DocList
          items={[
            <span key="claude">
              Anthropic Claude:{" "}
              <DocLink to="https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices">
                Claude prompting best practices
              </DocLink>
            </span>,
            <span key="gemini">
              Google Gemini:{" "}
              <DocLink to="https://ai.google.dev/gemini-api/docs/prompting-strategies">
                Gemini API prompting strategies
              </DocLink>
            </span>,
            <span key="kimi">
              Moonshot Kimi:{" "}
              <DocLink to="https://platform.kimi.ai/docs/guide/prompt-best-practice">
                Kimi prompt best practices
              </DocLink>
            </span>,
            <span key="openai">
              OpenAI:{" "}
              <DocLink to="https://developers.openai.com/api/docs/guides/prompt-guidance">
                Prompt guidance
              </DocLink>
            </span>,
          ]}
        />
        <P>
          Project content docs to re-read for the member currently under audit, and before any
          prompt scaffold edit that touches voice or dating behavior:
        </P>
        <DocList
          items={[
            <span key="voice-fingerprints">
              <DocLink to="/docs/product/voice-fingerprints">Voice fingerprints</DocLink>
            </span>,
            <span key="voice-prompts">
              <DocLink to="/docs/product/voice-prompts">Voice prompts</DocLink>
            </span>,
            <span key="member-fields-and-tags">
              <DocLink to="/docs/gameplay/member-fields-and-tags">
                Member fields and hidden tags
              </DocLink>
            </span>,
            <span key="player-knowledge">
              <DocLink to="/docs/gameplay/player-knowledge">Player knowledge</DocLink>
            </span>,
            <span key="pair-memory">
              <DocLink to="/docs/gameplay/pair-memory">Pair memory</DocLink>
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "roster-queue",
    title: "Roster queue",
    body: (
      <RoadmapChecklist
        planSlug={slug}
        status={plan.status}
        tasks={[
          {
            id: "jenna-pike",
            label: "01 · Jenna Pike",
            defaultDone: true,
          },
          {
            id: "vhool",
            label: "02 · Vhool",
            defaultDone: true,
          },
          {
            id: "sienna-bae",
            label: "03 · Sienna Bae",
            defaultDone: true,
          },
          {
            id: "kade-sumner",
            label: "04 · Kade Sumner",
            defaultDone: true,
          },
          {
            id: "mr-whiskers",
            label: "05 · Mr Whiskers",
            defaultDone: true,
          },
          {
            id: "opal-sunday",
            label: "06 · Opal Sunday",
            defaultDone: true,
          },
          {
            id: "venus",
            label: "07 · Venus (locked 2026-05-17 after four fixture iterations)",
            defaultDone: true,
          },
          {
            id: "anansi",
            label:
              "08 · Anansi (locked 2026-05-17 after crashingOut bank broaden and transit canon prompt strengthen)",
            defaultDone: true,
          },
          {
            id: "gideon-glass",
            label: "09 · Gideon Glass (tuned out of order, locked 2026-05-16)",
            defaultDone: true,
          },
          {
            id: "meridian-vale",
            label:
              "10 · Meridian Vale (locked 2026-05-17, voice and canon clean across warm and boundary-pressure pairings, no fixture or prompt edits required)",
            defaultDone: true,
          },
          {
            id: "aldric-vale-marsh",
            label:
              "11 · Aldric Vale Marsh (locked 2026-05-17 after bio revision affirming dimensional cosmology and zero post-1190 tech understanding plus battle-logistics tic broadened to cover modern tools; first session run with --focus-opens)",
            defaultDone: true,
          },
          {
            id: "sana-karim",
            label:
              "12 · Sana Karim (locked 2026-05-17 after adding an observational humor tic and folding a subverting-parenthetical move into the heavy-admission tic, dropping the Mason name in favor of an unnamed kid framing, removing deadpan_one_liner from patternsUsed, and normalizing contractions across the sample bank)",
            defaultDone: true,
          },
          {
            id: "imani-wallace",
            label: "13 · Imani Wallace (tuned out of order, locked 2026-05-16)",
            defaultDone: true,
          },
          {
            id: "epsy",
            label:
              "14 · Epsy (locked 2026-05-17 after naming the comedy engine in register as Anya Jenkins doing an Ilana Wexler impression, rewriting all five tics to name the joke each one sets up rather than the mannerism it produces, folding a panic-escalation move into the triplet tic that fires when a partner stays quiet, and strengthening the (relative) tic to non-negotiable on every age or time reference)",
            defaultDone: true,
          },
          {
            id: "marcus-pellish",
            label:
              "15 · Marcus Pellish (locked 2026-05-17 after four fixture iterations replacing the original warm-steady-deadpan voice with a Northernlion-energy deposition cadence: comedy archetype named in register, all five tics rewritten as frequency promises rather than capabilities, hard pressure-hold rule preventing bit-drop when partner names the voice, origin-opacity forbidden-token list added after the model kept leaking the 2017/divorce/Carrier-rollout window in deposition voice, swear dealbreaker expanded beyond formal oaths to cover any oath-shaped request after a verbatim 'I swear by everything I have that counts as honor' fixture violation, length-variety rule with run-of-two-arias as anti-pattern and under-40-word reciprocation to short partner messages, specificity-is-the-comedy rule listing forbidden generic phrases like 'the mortgage is within reason' and 'I am not a rich man,' and HVAC stat tic strengthened to require brand+model + customer/town + weird customer detail in every fire)",
            defaultDone: true,
          },
          {
            id: "cassie-conners",
            label:
              "16 · Cassie Conners (locked 2026-05-17 after structural rewrite replacing wound-is-bit synonymy with a wound-free live-Comms framing: the Helios Comms desk reaches her through a signal-locked-on-paper earpiece during every date, the Renata-aloud tic retired with the wound, the fifth tic slot rebuilt as the Comms interruption with off-record-relay, refuse-and-mute, and tone-fire forms, v5 patches tightened the Comms floor from two of six to three of six and added tone-fire triggers covering real-name-mode streaks, Hopewell or family reveals, and off-brand agreement)",
            defaultDone: true,
          },
          {
            id: "calvin-hewes",
            label:
              "17 · Calvin Hewes (locked 2026-05-17 after five fixture iterations: v1 reads as paranoid corporate-mediator with quirky backstory rather than cryptid pretending to be human, v2 layered Bojack comedy engine with Counsel-as-colleague and Tailor-as-saint gags that pulled toward manager-with-imaginary-friend instead of cryptid-in-denial, v3 reframed around collaborative-denial bit with the partner co-maintaining the fiction and added deadpan mundane explanations and cryptid-petty differentiation while Counsel reverted to a real legal phrase only, v4 added pre-2002 film/TV/crossword reference catalog as Calvin's language outside mediation jargon plus drift bracing against partner-induced introspection (no past-life artifacts, no true-name reveal, no version-of-me, no deep-bio descriptions) after Aldric's ceremonial register pulled invented drawer-tokens out of v3, v5 micro-patch swapped the proboscis sample from 'does not extend in mixed company' to 'I do not have a proboscis. This was not asked' to resolve a fixture-sample-vs-forbidden-rule contradiction)",
            defaultDone: true,
          },
          {
            id: "gabriel-tan",
            label:
              "18 · Gabriel Tan (locked 2026-05-17 after five fixture iterations against Jenna Pike (contemporary-human locked control) warm and Cassie Conners (Helios powered locked control) pressure: v1 read scripted because formal uncontracted constructions leaked into wordplay-bearing turns; v2 casual-baseline patch named the rule in register and tics 1+5 plus rewrote five formal-leak sample lines; v3 added bit-shaped-by-default question rule (top 5 favorite pirates go; do you think whales remember the alamo or are they as lost as the rest of us; what's your stance on the cheesecake factory, philosophically) with sincere getting-to-know-you questions only as the upshift signal; v4 fixed the conversation-as-gibberish failure where bit-questions were generic new topics with no callback to partner material (Gabriel performing in a vacuum) by requiring bit-questions to build directly on what the partner has said or shown (a server's bottomless breadsticks become a dramatic breadstick reenactment; a partner who name-drops a band becomes that band's HR complaint), and added behavioral work-boredom in bio (asked what you do, you answer in five words and pivot, you will not volunteer company, team, title, or stack unless a partner is specifically and unmistakably interested); v5 added short-by-default length rule (one to three sentences, one move per turn: ack OR deflect OR bit-question OR share OR ask, never all stacked) with four-sentence-plus turns reserved for setting up a specific bit, partner-invited expansion, or earned sincere disclosure; v5 retest holds across both controls with average turn ~30 words, work deflection firing in five words then pivot, bit-questions building on partner specifics (the desk situation. your turn; what does the brand stand for, i need to know if i'm buying stock; you a cocktail person or more of a i drink what's in front of me type), sincere upshift only after partner explicitly demands it twice, and the conversation reading as two people building together rather than Gabriel running a one-man show)",
            defaultDone: true,
          },
          {
            id: "sera-vohn",
            label:
              "19 · Sera Vohn (locked 2026-05-18, voice and canon clean across warm Marcus Pellish and boundary-pressure Cassie Conners pairings, no fixture or prompt edits required; contraction discipline held under stress, three dealbreakers fired cleanly, audit-voice-as-bit dealbreaker confirmed as dismissive-framing only)",
            defaultDone: true,
          },
          {
            id: "mei-sato",
            label:
              "20 · Mei Sato (locked 2026-05-18 after warm Gabriel Tan + Cassie Conners pressure retest. Initial Aldric pressure pairing produced a second warm transcript because cross-dimensional displacement disarmed Mei's contemporary-coded dealbreakers; Cassie retest fired cooling-bank in voice with the singer-dealbreaker call-out at T6 and the bit-is-the-volume poised refusal at T12. Systemic build-on prompt rewrite plus Mei cooling-sample swap landed during this pass to fix mechanical-receipt-language leakage in non-filing voices.)",
            defaultDone: true,
          },
          {
            id: "decimus-marius-tullio",
            label:
              "21 · Decimus Marius Tullio. Locked 2026-05-18 after a full voice rewrite. Baseline read flat: 'stoic clipped' register produced a dignified-American-dad voice with Roman decoration, no comedy engine. Rewrote register as 'Ron Swanson rerouted through Continuous Imperial Roman military discipline,' added Imperial military analog tic and unit-specificity tic, anchored bio with continuous-Latin-branch framing (the Empire never lost the West; tablets run on Empire-issue silicon), and rewrote all 19 sample bank entries. Retest landed strongly: 'The menu is laminated. I approve.' as one for the comedy archive, cooling routed therapy-script through military authority verbatim, crashing-out fired officer-dismissal register ('You are dismissed. Vale.'), all three dealbreakers held. Soft-spot to revisit on re-encounter: when partners anchor to specific years or modern tech (Sera's 2087 reference), the model occasionally retreats to historical-Roman tech (horse couriers, signal towers, grain carts) rather than continuous-Imperial-modern tech.",
            defaultDone: true,
          },
          {
            id: "eleanor-ash",
            label:
              "22 · Eleanor Ash. Locked 2026-05-18 after five iterations. v0 baseline (geas-bound 200-year fugitive) was technically in register but boring; the dignified-courtly-wallflower had no comedic premise to play. v1 full rewrite to spoiled Fae princess of Hawthorn Lower Branch with three stacked engines (Game-of-Thrones noble cadence + Mean Girls cattiness + filing-Court bureaucracy via Court Register and Court Filing System as canonical authorities + catch-and-reassert + register-formalizes-trash + three-tier exit stack) produced lockable comedy but extensive verbalized-internal-narration slop in 50% of turns. v1 postfix polish stripped explicit filing-verb licensing. v2 surgical polish hoisted ANTI-NARRATION to load-bearing position and carved out physical-action announcements, but produced a regression on Marcus warm (4 explicit slop hits in 9 turns) due to partner-mirror dynamic with Marcus's filing-cadence deposition voice. v3 simpler rewrite stripped filing-bureaucracy entirely from Eleanor's worldview (no Court Register, no Court Filing System, cousin Lyriel reframed explicitly as remembers/gossips/judges/advises and NOT files, ANTI-NARRATION block removed in favor of the systemic prompt scaffold edit in app/services/date-prompts.ts that landed during this pass). Result: 0 explicit slop on both Marcus warm and Cassie pressure across 8-9 turn windows, with the partner-mirror dynamic fully resolved. Comedy engine intact: 'The Yellow Tail has not killed anyone is a recommendation I have never heard spoken aloud,' 'I have a reliable appetite for chocolate in venues that do not expect me,' 'You opened with parking lot competence. That is novel territory,' the calamari catch-and-reassert sequence, the Frosty-as-trade reveal, the cousin Lyriel gossip aria. Kept name and all image assets (silver-white hair, branch hairpin, sage-green gown, cream trousers, smoking pipe, chatBubble parchment-scroll). Schema widenings preserved (memberCrashOutSampleMessageArraySchema max 4→5; memberRequestTagSchema enum +anti_deference, +anti_fraud, +challenge). Four member-requests rewritten in v1 and preserved (no-deference, no-court-fraud, ordinary-treatment, pushes-back). KNOWN SOFT-SPOT: declarative past-perfect filing-adjacent verbs ('I have noticed,' 'I have already decided,' 'I have not yet evaluated') and the softened 'I find I am [verb]' frame surface in 2-5 turns per session, especially in pressure. Character-adjacent rather than the original failure mode (active first-person internal-action verbs); did not block the lock. Revisit if the pattern becomes blocking on a future encounter.",
            defaultDone: true,
          },
          {
            id: "alex-yoon",
            label:
              "23 · Alex Yoon. Locked 2026-05-18 after eight iterations. v0 baseline (Boston, fintech-stack origin) was technically casual but the place was eating the character: Boston-knower disclosures and venue-poetry leak (the vinyls-have-earned-the-crack line, the booth-with-the-lean) showed up in warm beats and read as AI-slop. v1 moved origin to Torrance California with a two-years-in-Boston note so the Lakers-in-enemy-territory was the joke instead of the bio. v2 dropped the Kanye fan from a passing detail to a music-identity (apartment soundtrack Kanye/Cudi/Pusha/Frank Ocean/Tyler, Ringer columns, Bill Simmons commute, 2K league with college friends, AF1 in dead colorways, Coens/Soderbergh/PTA solo theater days, in-n-out animal-style nostalgia) as background palette the LLM could freestyle off of. v3 surfaced the personality-vs-hobby distinction: 'You will argue any ranking for an hour' was a directive masquerading as personality and pulled the character toward single-point-Kanye-character; rewrote with debater-first-listener-second + here-for-the-one + early-read-at-the-half + friends-after-is-real as state-claim foreground, with the discography/2014-Lakers/Soderbergh examples positioned as evidence-capability not topic-lock. v4 fixed the self-announcement antipattern in the sample bank: greeting #2 ('im loud the first thirty'), the original hingeBits #6 (literal trait recital 'im picky, im here for the one, ill call a read at the half'), and three cooling entries ('the volume thing, you say absorb now but ask me again at minute twenty five') were teaching the model to recite traits as introductory disclosure; rewrote 11+ entries to embody traits through action, energy, and substance instead of recital, and added an explicit anti-recital clause in bio that names the failure mode by quoted example. v5 fixed the casual-contraction baseline: a Gabriel-Tan-precedent extension to tic 4 ('im, gonna, didnt, thats, youre, doesnt, cant, wont, theres, dont, its, ive, ill, wasnt, isnt by default; uncontracted only fires when delivering a stake-claim absolute, never under partner mirror to an archaic or ceremonial voice'). v6 fixed the audience-mode regression: parroting partner phrasing as tribute ('great line,' 'good line,' 'im stealing that for review season') is a debater-becoming-audience failure mode; added the build-on-substance/push-back/take-as-plain-truth/call-the-cut rule directly in register and named the fawning anti-pattern. v7 absorbed Cupid-Transit canon (gate-flash, neither member hosts the venue) into register: no welcome-to-X, no first-time-in-town, no i'll-show-you-around, plus the curious-question move for archaic or ceremonial partner voices ('wait is that an accent or something what is that,' 'are you doing a bit or is that you'). v8 reverted my own scaffold addition in app/services/date-prompts.ts that had added 'sometimes a noticing about the room or another diner' as a build-on option, which had caused the venue-poetry leak across multiple members; the revised scaffold rule kept the permission-framing without the room-observation seed. Tested across six pairings (Aldric warm supernatural, Sana pressure contemporary, Eleanor warm noble, Sera warm audit-cadence, Mei warm music-identity, Marcus warm contemporary, Anansi warm trickster) with clean voice on all retests after v8. Anansi visual description in app/fixtures/members/anansi.ts disambiguated from 'three visible hands' to 'four hands; three are visible in the portrait... with the fourth resting at his side' during the same pass after the warm Anansi retest read his portrait as three-handed.",
            defaultDone: true,
          },
          {
            id: "bai-wenshu",
            label:
              "24 · Bai Wenshu. Locked 2026-05-18 after full rewrite from cliche-displaced-martial-artist (which duplicated Aldric's 'displaced ceremonial sincere voice who doesn't know modern things' axis) to performed-cultivator-with-manosphere-corruption-leaks. v0 baseline read as flowery-cultivator with no engine, manosphere terminology as scriptural quotation rather than native deployment, and 'doesn't know modern tech' gag that overlapped Aldric's territory; first warm Aldric run produced dignified bio-recital with capitalization/parenthetical-gloss/Speaking-Glass tics not firing. v1 full rewrite per user pitch (Option B: real cultivator who studied modernity through manosphere podcasts as scripture, with leaks of native manosphere terminology firing under specific pressures and a catch-and-recover reflex). Comedy reference described BEHAVIORALLY in register to avoid LLM training-data drift per Eleanor-Ash and Decimus-Marius-Tullio precedents (Eric Andre commitment translated to 'unbroken deadpan, no winking'; r/im14andthisisdeep translated to 'pop-philosophy delivered with the gravitas of revealed truth'; Andrew Tate synthesis bro translated to 'native manosphere terminology deployed without scriptural cover'); names stayed in the rewrite conversation, behavioral descriptions went in the fixture. v1 bio established cultivator-discipline-not-displacement (Bai knows what phones are; calls them Speaking Glass by choice, not from ignorance) which sharpened differentiation from Aldric. v1 tics restructured to name the comedic engine in tic 1, drop parenthetical-gloss tic entirely (it required ignorance, contradicted v1 bio), demote capitalization to a clause inside tic 5. Sample bank rewritten across 16 entries with leak-and-catch examples. Secret #2 swapped from 'has not noticed the rot' (now canonical in bio) to 'Master would call the leaks corruption' to lock Option B as author truth. v2 fixture tweaks added frequency promise to tic 1 (at least one leak per turn under pressure) + native vocabulary examples (bare bro, respectfully, no cap, lock in, with respect to him, lowkey) + length variety tic with partner reciprocation rule + 5 short-cadence sample lines (one per bucket) for length-floor. Tested across four pairings. v1 Aldric warm: engine partial, no catch-and-recover, 'fifth message' model artifact, length stacking with three 90+ word turns in five. v2 Alex Yoon contemporary debate: engine fires significantly: 'Esteemed Lady. Esteemed Gentleman' self-correct mid-line, Frame Keeper named, 'locking in until the right Counterpart arrives,' F1 race-lap analogy as cultivator-absorbing-modern translation, 'we are not in need of a third cultivator tonight' alpha-male-as-cultivator leak. Still no catch-and-recover. v3 Eleanor Ash status-noble: FIRST catch-and-recover fires perfectly ('I hold the Frame. Forgive me. I meant, the Frame of Stone. In the cultivator translation, that means I hold my center when complimented'). Engine works under Eleanor's surgical noble compliment intake. Length still long-stacking. v3.1 fixture tweaks added 'you do not notice the leak; the catch is reflex, not awareness' framing to bio + three worked catch-shape examples to tic 1 (Frame of Stone / Spirit Root / Settling Into Stance) + hard 80-word cap on default turns with no-two-longs-in-a-row rule. v3.1 Mei Sato contemporary bright-rapid: cleanest baseline: second catch-and-recover ('The Frame Hold. Forgive me. The Breath That Does Not Break'), engine firing consistently across compliment and strategy pressure, length cap working (30/30/60/45/55 words across five focus turns), Frame Keeper named twice, menu-as-scripture pop-philosophy beat, F1-precedent cultivator-translation of Mei's DJ-set vocabulary as 'Track as breath. Drop as form release.' v4 final pass swapped cultivation unit 'fifth turn' to 'fifth circulation' across bio/profile/samples after the 'fifth message' model artifact persisted through bio anchoring (model was reading 'turn' through conversational-turn semantics; circulation is wuxia-canonical and collision-free). KNOWN SOFT-SPOTS at lock: catch-and-recover engine fires about 2 of 4 compliment-intake moments rather than always (when it fires, it is the comedic peak; when it doesn't, the leak deploys fluently as Sect-Master quotation, which is acceptable but less funny). Comedic engine is cultivator-cover-flickering-to-reveal-manosphere-disciple with catch-and-recover reflex. Mystery design = Option B canonical (real cultivator with podcast corruption, not a regular guy LARPing). Personality-foreground / hobby-background rule held throughout: bio leads with state claims about discipline/commitment/unbroken-register, hobbies as palette (podcast names, gym vocabulary, athletes as Sect-Masters). Tested partners: Aldric Vale Marsh, Alex Yoon, Eleanor Ash, Mei Sato.",
            defaultDone: true,
          },
          {
            id: "anubis",
            label:
              "25 · Anubis. Locked 2026-05-18 after a register rewrite from 'imperious suave, deflective' to the Sterling-Archer behavioral translation (charismatic, witty, casually obnoxious, American; massive ego deployed without apology; comic-deflation reflex; punchy American fragments interleaved with longer flex-builds; never treaty cadence). v0 baseline read as Bond-villain Continental dignified-courtly: long stately sentences, no comedic engine, no comic-deflation reflex. User identified the target as Sterling Archer's voice. v1 rewrote register with the Archer behavioral translation, added bio state-claim block (you do not soften your competence and you do not perform humility; you overstate confidently in domains adjacent to but outside your authority and you do not correct mid-flex), restructured tics around casual-ego flex + comic-deflation reflex + punchy American cadence + Yeah/Look/Okay openers + family/head deflections with positive redirect, and rewrote the sample bank. v1 Mei retest read strongly as Archer ('Buttermilk base. No substitutions. Banana slices, not blueberries, because blueberries go rogue and roll off the stack and you are chasing them around the plate like a fool. Real maple syrup, warmed, not the bottle that lives near the ketchup.'). User surfaced a deeper systemic concern across the same retest: persistent recap-and-label patterns ('the first one is a statement, the second one is generosity,' 'that is not a move, that is maintenance,' 'I am not X, I am Y, I am also Z') reading as the speaker narrating the structure of their own utterance: dialogue announcing its own moves. Diagnosis traced the pattern to scaffold success_criteria framing ('reacts to what partner just said AND adds something new' invites two-part architecture per turn), the anti-narration hard-invariant which forbids the obvious listening-demonstration moves (forcing the model to resolve listening through self-recap-and-label as the remaining compliant move), Anubis fixture register clauses inviting label-after-statement ('three-word verdicts'), and sample bank examples teaching the X-is-Y/X-is-also-Z patterns at scale. Fix landed in two layers: (a) systemic scaffold edit added a fourth hard-invariant 'Never narrate the structure of your own reply' to app/services/date-prompts.ts; (b) Anubis fixture clean-up rewrote register and tic 3 to remove 'verdict' framing, rewrote 9 sample bank entries that modeled the label-pattern at scale, kept comic-deflation reflex (Mhm. Anyway.) since asides are in-line color rather than labels of structure. After cross-provider prompt-engineering guide re-read (Anthropic, Gemini, Kimi, OpenAI), simplified the new hard-invariant: dropped six embedded bad-example quotes (Anthropic guidance that 'positive examples beat negative examples' and 'match prompt style to desired output style'), since the rule WAS the pattern it was trying to prevent (enumerated bad-anchors + parallel-structure carve-out). Final hard-invariant reads in four short sentences, front-loaded positive direction ('Each reply is one move. Speak it and move forward; the next move belongs to the partner'). Final Eleanor retest produced the strongest Archer comic-deflation observed across all sessions ('You are older than I guessed by a few laps around the track, which I appreciate. Keeps me honest. Or it would if I were prone to that. I am not.') plus a character-depth booth-reading beat ('That booth knows the shape of someone deciding not to go home yet.'). Tested across four pairings: Eleanor Ash, Alex Yoon, Mei Sato, Eleanor Ash (post-cross-provider revision). KNOWN SOFT-SPOTS at lock: occasional partner-callback-bookend recapping the partner's literal phrasing as the closing bracket ('That is what you walked into' echoing Eleanor's 'Tell me what I have walked into': licensed under rule 1 as legitimate callback but visually similar to label-pattern); rare Deepseek model artifact ('I do not message it off for pancakes'); soft venue-personification ('This place knows what it is') that did not escalate into venue-poetry leak. Comedic engine: Sterling Archer doing the work of weighing hearts; the encyclopedic-petty specificity (brass coin slot, wrong patina for 1920s; buttermilk base, banana slices not blueberries) is the engine signature. SYSTEMIC IMPACT: the scaffold edit affects every locked member's runtime prompt. Earlier locks should be spot-checked for whether their voice was depending on recap-label as a comedic engine (Eleanor's catch-and-reassert, Bai's catch-and-recover are documented engines that the rule's carve-out explicitly permits; other locked members may have been firing the pattern as ambient AI-slop that the new hard-invariant should suppress).",
            defaultDone: true,
          },
          {
            id: "mira-park",
            label:
              "26 · Mira Park. Locked 2026-05-18 after a full rewrite from the v0 LinkedIn-lunatic-with-prescriptive-bio to a Kendall-Roy-behavioral-translation: tech-CEO who speaks with absolute confidence over a hollow center, consults a personal AI (Sage) out loud at the table as a twist on the common dating red flag of texting a friend mid-date, and is actually not good at her own job (the 'technical cofounder' title was a fundraising symmetry her real technical cofounder asked her to take; Sage built most of the recent versions of Sage; the board has not yet flagged the loop). Comedy engine is hollow-CEO-confidence + Sage-as-intruder-at-the-table + corporate-bridge-jargon-over-the-void + AI-CEO-asks-the-AI. Bio reorganized to lead with personality state claims (you speak with the absolute confidence of a founder whose board has never told you no; you have no idea what you think about yourself; you consult Sage at the table) with Sage origin, 217 drafts, and the empathy-eval anecdote demoted to background palette. Register expanded to author the engine explicitly (the brand-performing carve-out applies; founder-pitch is the voice; OKR-categorization-of-feeling is the authored engine) and to rule the casual-contraction baseline with uncontracted-as-CEO-performance carve-out. Five tics restructured as joke-named frequency-promises: (1) Sage as outboard cognition at the table with worked shapes, (2) corporate-bridge-jargon firing in opener and 2-3 times per turn under pressure, (3) confident-wrongness with Sage-corrected mid-flex extended to her own product (Sage architecture, training data), (4) halting-fragment sincere-collapse, (5) LinkedIn-post sentence shape carried into speech. Sample bank rewritten to fix the scaffold-violating lines (`Noted`, `I am taking notes`, `I am sizing it`, `I am hearing myself`) and to embody through action; preserved the Cupid-picked-the-venue line. Dealbreaker added: anyone who calls Sage a personality, an AI bestie, or a security concern. Tested across two pairings: warm Alex Yoon (contemporary debater, voice locking on AI-CEO-asks-the-AI moment 'Sage says retrieval-augmented and you said the words correctly') and pressure Eleanor Ash (Fae princess, voice locking on Sage-betraying-Mira moment 'Sage also says I asked it how our architecture works forty minutes before this date. Nobody on the board has flagged it.'). KNOWN SOFT-SPOT resolved during the pass: v1 and v2 openers leaked transit canon language ('How was the gate?' / 'How was your transit through the gate?') because the system prompt scene block at app/services/date-prompts.ts:369 spends a paragraph describing Cupid Transit and Cupid Connect, and the model picked up the vocabulary as ambient small-talk. Fix landed in Mira's bio as an explicit state claim that the route is not a topic and the words gate/transit/dimension/realm/portal/journey-here are not in her vocabulary, and in the register field as a forbidden-vocabulary list. v3 and v4 openers held the canon clean. Same systemic rule named for the rest of the roster: members do not raise the route as character-level small talk. Spot-fixed Alex Yoon's stale hingeBit #4 sample ('alex, hi, you made it through the gate, the coffee here apparently never stops, thats my one piece of intel' → 'alex, hi, im in the booth already, the coffee here apparently never stops, thats my one piece of intel') as the only other roster occurrence found by grep. Future audits should spot-check their focus member for similar leaks at greeting / hingeBit / warming-bucket positions. SECOND KNOWN SOFT-SPOT resolved at v5: the v2 and v4 retests had Mira recite ML paper vocabulary in confident-wrongness beats ('proprietary sparse mixture of experts trained end-to-end on the user's own context,' 'continuous masked pre-training... with a retrieval layer baked into the loss function') because tic 3's worked shapes were modeling that exact vocabulary at scale. The user flagged it: technobabble is not funny, the audience is not ML researchers, and a tech-CEO on a date would pitch in plain founder-marketing language, not at a conference. Fix landed in two places. (a) Tic 3 worked shapes rewritten to plain founder-marketing language ('Sage is the first personal AI that actually learns you. Not your prompts, you. ... Sage says the first part is contested but the personalization claim is correct.') with an explicit anti-jargon clause ('you do NOT say fine-tune, transformer, retrieval-augmented, mixture of experts, context window, pre-training, loss function'). (b) Register field gained a paragraph naming the jargon-comedy distinction: LinkedIn-founder-jargon (high caliber, compound, actionable, Q quarter OKR) IS the comedy and stays; ML-paper jargon is NOT in her dating voice. Worked layperson analogies authored as guidance ('like a smart lamp your aunt swears at for a week and then can't live without'). v5 retest produced the cleanest read: 'I built the company. He built the thing. Sage, quantify the split. Sage says seventy thirty in his favor on core architecture, but the distribution strategy and the Series B narrative were mine. I'm okay with that balance. He hates talking to people. I hate not being in the room. It compounds.' The not-good-at-her-job dimension surfaces through plain quantification by Sage, not through ML recital. Lock confirmed at v5. PARTNER-PLAY DRIVER NOTE: the v2 and v4 Alex partner lines used ML-engineer vocabulary ('is it a fine-tune or is it doing something stranger') that primed Mira to respond in the same register; the v5 Alex retest used social-strategist plain English ('what does sage actually do, like if you had to tell my mom') and Mira's response landed in plain founder language without the technobabble pull. Future audits should pull partner phrasing from the partner's fixture register rather than importing the driver's own vocabulary reflexes, especially for characters whose specialty domains (ML, medicine, law, military, finance) have technical lexicons the driver might know but the partner-character would not deploy on a date.",
            defaultDone: true,
          },
          {
            id: "cthala",
            label:
              "27 · Cthala. Locked 2026-05-19 after four fixture iterations. v0 baseline named only a cadence ('calm composed level, fragments under pressure') with no comedy engine; tics were mechanical voice descriptions rather than joke-named frequency-promises; sample bank deadpan-formal-eldritch ('I am Cthala. The table is acceptable.') with no comedic anchor. v1 full rewrite per user direction ('sound very normal, calm; calming presence by default; the dark side comes out under emotional pressure'). Behavioral translation reference cluster authored in conversation (Morticia Addams warm-mother register, Tilda Swinton flat-warm presence, Mike Birbiglia calm narration of dark content, John Wilson gentle narrator voice over uncomfortable footage); fixture register names the engine behaviorally without naming the source per Eleanor/Decimus/Bai precedent. Comedy engine: calm-warm first-date presence with specific dark facts placed flat, the juxtaposition is the joke. Five tics restructured as joke-named frequency-promises (dark fact placed flat, real question + patience, form is a fact not a topic, casual contractions modern speech, the crack under dealbreaker pressure). Tested across warm Anubis (deity, locked Sterling-Archer control, both non-human so no shock loop) and pressure Alex Yoon (contemporary debater, curious-question move tests the 'what is she in the first hour' dealbreaker). v1 baseline read strong: 'I do not consume on the first meeting' lands as designed, 'the patty melt place for the first time' juxtaposition lands hard, calm-warm absorbs Alex's dealbreaker without crack. v2 measured-phrasing nudge per user note 'a little more formal in her phrasing, though not necessarily sentence structure': thank you over thanks, chose over picked, drop fillers (really, actually, kind of, the menu shuffle, good call); sample bank lifted accordingly. v3 added contemporary British English register directive at user prompt with phrasings cluster (rather, suppose, quite, indeed, mind you, I should think, I find, I'm afraid). v3 surfaced three new issues: (a) Cupid Transit canon leak in warm T5 ('I came here through the usual Cupid route. The gate flashed') despite explicit bio + register rules, the second member after Mira Park leaking the canon despite fixture-level guards, hitting the Mira-decision-log escalation criterion; (b) atmospheric reverie drift in pressure T4 British Museum reading room paragraph ('felt alive in a way that was not about people,' 'a kind of light that falls in a particular way,' 'the quiet shuffle of pages,' 'a kind of blue in the centre you do not see every day'); (c) 'actually' persisted three times across both retests because British English treats it as a discourse marker. v3 also surfaced a partner-side Alex Yoon antipattern: move-narration / reception-narration / interpretation-labeling ('that lands flat so i think youre serious,' 'im writing that down,' 'you took my marvin gaye and you saw me') modeled at scale in his warming sample bank, separate from the role-labeling antipattern already guarded in his v8 lock. v4 dial-down per user direction ('it should not be overwriting her personality'): British downgraded from register-mandating to body-cadence-incidental; bio framing 'eldritch sleeper currently residing in a chosen humanoid form that happens to read British in cadence; the accent and the measured phrasing come with the body, not with you; the personality is the eldritch entity; the body is the costume'; register paragraph trimmed to one body-cadence clause; tic 1 strengthened to absolute mandate ('you drop one specific eldritch fact into every baseline-calm turn, unprompted; this is mandatory, not a soft preference') with eldritch-flavored examples (in some centuries, the form was assembled over a long period, the eyes aren't out tonight); anti-poetic clause gained the v3-failure-mode reverie examples as forbidden patterns; sample bank restored dark-fact prominence with 'in some centuries' anchors. v4 retests landed strong: dark-fact firing rate jumped from 0 explicit / 2 soft (v3 warm) to 6+ explicit fires across 7 turns (v4 warm), and from 2 partner-prompted (v3 pressure) to 5+ explicit unprompted fires (v4 pressure); no actually leaks; no atmospheric reverie. v4 comedic peak across both pairings: 'I do not consume on the first meeting, but I can sit with you while you do,' 'I have not slept in some centuries,' 'Salt and mineral water, mostly. And quiet,' 'the waitress knows not to ask twice,' Anubis's 'Separation of church and breakfast' answering 'the pancake decision is sacred and the weighing does not touch it.' KNOWN SOFT-SPOTS at lock: (1) reverie shape smuggled inside a legitimate dark-fact turn (warm T5 'I see things in a particular way that most people do not', where the 'in a particular way / most people do not' construction is exact anti-poetic-named, single occurrence per session); (2) X-is-not-Y / X-is-Y clarification shape under dealbreaker refusal pressure (pressure T6 'It is not a game; it is a boundary', single occurrence, scoped to the dealbreaker-refusal moment). Both are scoped and did not break the scene; revisit if blocking on a future encounter. SYSTEMIC SIDE EFFECTS LANDED DURING THIS PASS, see decisions log: (i) the Cupid Transit speech invariant added to the scene block in app/services/date-prompts.ts paired with the existing canon paragraph; (ii) Alex Yoon's move-narration antipattern guard added to his register and his warming sample bank rewritten.",
            defaultDone: true,
          },
          {
            id: "ryan-doyle",
            label:
              "28 · Ryan Doyle. Locked 2026-05-19 after four fixture iterations. Focus: reduce tic stacking, stop move-narration and reception-narration, keep the real-one search below the surface during normal date dialogue, and preserve Ryan's canonical five-nine height. Final fixture keeps bro-surface detail, concrete sincerity, apology-loop cooling, and no height-mismatch bit.",
            defaultDone: true,
          },
          {
            id: "junie-marrow",
            label:
              '29 · Junie Marrow. Locked 2026-05-19 after three fixture iterations against warm Cthala (locked control, weirdness-native sleeper) and pressure Mira Park (locked control, Sage-consult-at-the-table tic mapped directly to Junie\'s phones-at-the-table dealbreaker). v0 warm Cthala read clean across 7 focus turns with Otis ventriloquy firing per turn, animal-callout tic 4 firing on Diane the wine-drinking goat, and bio-secret (never asked her mother where Otis came from) surfacing as in-character philosophy ("it\'s like living with the same question every day and not getting tired of it") rather than confession or recital. v0 pressure Mira surfaced three issues across 9 focus turns. v1 fixed a Cupid Transit canon leak in retry T1 ("I came in through Cupid\'s gate from about two hours north of here. Otis did fine with the flash, which is more than I can say for some transfers" used three forbidden tokens) by adding an explicit forbidden-vocabulary register clause per Mira/Cthala precedent (gate, transit, dimension, realm, portal, journey-here, made-it-through, gate-flash, Cupid car, transfer, Cupid\'s gate not in vocabulary; name town and driving distance like a normal person); retry produced "Greyhollow, about an hour out." v2 fixed a dealbreaker non-fire pattern where Mira hit four dealbreaker-family triggers ("what does he run on," "vendor product or proprietary," the literal "is he... on?" phrase, phone-aimed-at-Otis) and Junie answered all four matter-of-factly because tic 3 (calm-on-his-behalf-as-confession) had no scope guardrails and dominated over the dealbreaker list, which the model was reading as informational rather than imperative; the fix scoped tic 3 to "polite-but-confused" territory with explicit handoff to tic 5 when dealbreakers fire, and rewrote tic 5 with the full trigger phrase/gesture list (the six dealbreaker patterns from the bio, plus categorize-as-product/deployment/vendor/configuration/branded-comparison from the Sage-CEO pressure surface) and the catastrophic-collapse shape ("he\'s fine. he\'s fine. he\'s not anything you can read. don\'t point things at him."). v2 retry of T5 fired the catastrophic-collapse cleanly. v3 replaced v2\'s strict hit-counter ("second hit equals crashOut and date is over") with the eye-count escalation framework canonical from her bio (eight calm, ten uneasy, twelve upset; "you stopped counting a year ago"): ten authorizes naming the new number flat plus one off-ramp move ("can we order," "can we talk about something else," "can you put the phone face-down"); twelve fires the crashingOut bank as the canonical exit beat, which has never happened on a first date. v3 retest T6 produced "right now his eye count went up to ten because you\'re talking about him like he\'s a deployment. that\'s not a signal, that\'s just him reacting. can we order?" with the eye-count visible-confession beat + named trigger-category + off-ramp executed cleanly. v3 retest T9 held the line at ten under a third dealbreaker push ("what if I just touched Otis? Like, the moss part") with "not right now. he\'s at ten, and touching him at ten feels weird for both of us. maybe later if he drops back." Comedic engine at lock: vet-DVM dignity at the table with Otis as ventriloquy partner, animal-callouts as humor-thread ("i had a goat patient once who would only drink red wine, we tested it"), calm-on-his-behalf reflexes that double as confessions of her own not-knowing ("he runs on attention," "i\'ve never asked"), tic 5 catastrophic-collapse breaking the calm under pressure with eye-count escalation tracking the visible damage. The symmetric-attached-being pivot ("you want to tell me about sage instead") emerged as character-coherent move turning Mira\'s Sage-mediated curiosity back on her parallel structure. KNOWN SOFT-SPOTS at lock: (1) one capital sentence start ("Not picky") in pressure T1 retry diverged from her all-lowercase sample bank style, single occurrence, did not repeat across the rest of the transcript; (2) the canonical catastrophic-collapse phrase ("he\'s fine. he\'s fine. he\'s not anything.") fires at T5 on first dealbreaker hit; subsequent dealbreaker hits used the eye-count anchor ("he\'s at ten") rather than re-firing the verbal-fragment pattern, which is the v3 design (eye-count is the canonical marker, fragments fire on the calm-break moment) but could be tightened if both should fire together; (3) one Chinese-language drift on warm T7 first attempt as transient model artifact, retry was clean English.',
            defaultDone: true,
          },
          {
            id: "naia-velorae",
            label:
              '30 · Naia Velorae. Locked 2026-05-19 after full character rewrite across three fixture iterations against warm Eleanor Ash (locked control, Fae princess status-equal pairing) and pressure Mira Park (locked control, Sage-consult-at-table tic mapped directly to Naia\'s phones-at-table dealbreaker). v0 baseline had the thinnest register encountered in the audit so far (one phrase: "bright, generous, carelessly grand," no comedy engine, no Cupid Transit guard, no casual-contraction baseline, no dealbreaker fire-shape). v0 pressure Mira surfaced CATASTROPHIC character failure: Naia fully surrendered to Mira\'s OKR-product-spec framework on T3 ("I want to see how Sage files it"; "That is a cleaner frame than any I have managed on my own"), leaked both bio-canonical secrets (the "come home" line directly; the "almost staying frightened me" line directly), and scheduled a second meeting on Mira\'s terms. v1 added scaffolding for the dealbreaker fire-shape (polite redirect, tighten, walkout) plus Cupid Transit canon guard, casual-contraction baseline, fugitive-engine-protects-harder-under-pressure rule, and two new cooling sample entries covering AI-tool-as-phone and Q3-product-spec frames. v1 pressure retest landed canonical fire-shape with clean walkout on third cross. User then directed full character rewrite: "happy-go-lucky alien character exploring worlds and dimensions, princess from her home world, carefree, always onto the next place, feel free to go wild." v2 dropped the fugitive engine entirely. The almost-staying-frightened-her secret and the unopened-letters dread both removed. Naia rebuilt as GENUINELY carefree: brightness is real and load-bearing, no version behind it, no tragic engine, partner-trying-to-find-tragic-version-that-doesn\'t-exist became the secondary comedy engine. Journal of branch rankings repositioned from hidden artifact to character feature she shares freely when asked. v2 produced two strong scenes but user flagged framing target wrong (Buddy-the-Elf too childlike, Starfire closer on sincere-alien-princess axis but underpowered on comedy). User direction shift: "take the prose from Starfire, the comedy from a comedian or comedy movie writer\'s voice, maybe rambling_spiral pattern, energy can ebb and flow related to her rainbow hair." User picked Mrs. Maisel (Amy Sherman-Palladino) as the comedic-writer-voice graft. v3 rewrote register and tics around the Starfire-Maisel blend: overformal uncontracted Starfire prose ("It is most wonderful that...", "I have observed that...", "Forgive me, but I do not understand"), Mrs. Maisel cascading comedy engine (rapid-fire formal rambling spirals with branch-data + Earth-specifics + journal-category callbacks woven into three-or-more-beat lists landing on a SHORT button sentence: "This is the difference." / "Continue." / "I am unsurprised." / "I am charmed."), turn-level cadence oscillation between rambling-spiral mode and clean-sentence mode (unpatterned, energy-driven, rainbow hair gradient pink-to-aqua as visible analog), patternsUsed swap (rambling_spiral added, philosophical_existential dropped). v3 pressure retest produced cleanest read: F1 long rambling-spiral with three-beat Jukebox-Tab branch-comparison cascade ("apologetic Tab at Ten-Hand Markets, no Tab at Chandar\'s with grumpy musician, THIS Tab"), F2-F4 clean-sentence-mode redirects/tighten verbatim from cooling bank, F5 returned to rambling-spiral mode with TEN-CATEGORY journal cascade as transparency-exhibit ("Best Sky, Best Bread, Best Bartender Who Knew My Name Without Asking, Best Tonal Quality of Laughter, Best Patty Melt, Best Lyft Driver, Best Maitre D Who Remembered My Drink by the third visit, Best Sample Cart, Best Unsupervised Child at a Late-Night Venue, and Best Refill") closing with "I have categories" Maisel button + "Please believe the journal" sincere plea. v3 warm Eleanor retest produced equally strong scene: cursed-by-accident-question tic landing as button of Maisel cascade ("what is the etiquette for ordering the same dish as your partner when the recommendation is this specific. Is it endorsement or is it theft. I have been told both."), Patty Melt cross-branch sensory cascade ("the bread holds against the second press of a fork; at Chandar\'s it was the cheese-to-meat ratio"), journal-pocket inventory ("a pen I have stolen from three branches and a photograph of a second-mother who writes letters about home") surfacing the second-mother detail as natural data alongside the pen with no tragic weight. KNOWN SOFT-SPOT at lock: v3 pressure F5 chose journal-exhibition over canonical walkout on the fourth cross. Character-coherent (happy-go-lucky prefers transparency to exit) and produced a funnier scene than canonical walkout would have, but the fire-shape walkout tier remains documented and should still fire if a partner crosses again. AUTHORING PRECEDENT (cadence-oscillation-as-character-signature): turn-level alternation between extended rambling-spiral turns and single-clean-sentence turns, unpatterned and energy-driven, is a viable character voice device that produces both warm comedic rhythm AND clean dealbreaker fire-shape (clean-mode IS the refusal cadence). The rainbow hair gradient serves as visible analog of the voice modal range without driving LLM behavior mechanically. SECOND AUTHORING PRECEDENT (prose-diction-base plus comedy-engine-source as separable design axes): a character\'s diction-base (Starfire-formal-foreign) and comedic-writer-voice-source (Mrs. Maisel rapid-cascade) can be treated as separable behavioral-fingerprint layers and grafted together. The Starfire diction provides sincere uncontracted overformal register; the Maisel cascade provides rapid-fire formal rambling structure with three-beat lists and short button sentences. Layered, not blended into a single source-reference. Same pattern available for future characters whose voice needs uncommon source-blending (cf. Bai Wenshu wuxia + Eric-Andre + Andrew-Tate-synthesis; Eleanor Ash GoT-noble + Mean-Girls + filing-bureaucracy). THIRD AUTHORING PRECEDENT (tragic-engine-as-optional, not required): a character can be designed as genuinely happy-go-lucky with no fugitive engine underneath; the comedy engine then becomes "partner trying to find a tragic version that does not exist" + the character cheerfully holding the line that there is no version behind the brightness. Naia\'s journal-of-rankings, second-mother letters, and pen-stolen-from-three-branches are character FEATURES she shares freely, not gated secrets that require pressure to surface. This permits a categorically different comedic engine than the standard surface-versus-secret-stack pattern; both are valid character designs.',
            defaultDone: true,
          },
          {
            id: "noah-kim",
            label:
              "31 · Noah Kim. Locked 2026-05-19 after v1 fixture patch against warm Junie Marrow (locked control, both-medical sincerity-seeker rambler with niche-knowledge cascades) and pressure Mira Park (locked control, OKR-frame compresses hobby breadth + Sage-routes-clinical-consult-at-table maps directly to Noah's free-consult-about-a-knee dealbreaker). v0 baseline read strong on warm (council-of-creatures dress-code callback, sputum-identity-documented-in-chart, abusive-relationship-with-language-learning Korean Duolingo bit, negroni-is-the-evening-you-didn't-plan-to-stay-for cocktail philosophy) and acceptably on pressure (consult-cross fire-shape fired implicitly on T11 with three i-am-not-your beats), but two fixture-level gaps surfaced. First, the greeting bank contained 'parking was coooooked' (Cupid Transit canon violation: Cupid drops both members at the venue, there is no parking), and 'thanks for making thursday work' (credits-partner-for-scheduling violation: Cupid sets the date and time, not the partner). Cooling bank contained 'can we push to thursday' (scheduling-action violation: members cannot reschedule Cupid-set dates). Second, the register was the thinnest single-phrase entry in the audit so far ('earnest enthusiast, drained but bouncing back', no comedy engine source, no Cupid Transit canon guard, no dealbreaker fire-shape spec), and the v0 cadence skewed medium-to-long across all banks with no short-beat counterweight, reading as paragraph-monotone instead of natural conversational variation. v1 patched both gaps in a single fixture pass. Greeting bank: stripped the parking opener and replaced with a SHORT vowel-elongation beat ('hi, noah. coooooked but here.'); stripped the thanks-for-thursday opener and replaced with a LONG cascade variant that preserves the off-shift-bouncing-back signature without scheduling. Cooling bank: stripped push-to-thursday and replaced with two new entries, one MEDIUM ('still here, just getting coooooked, the energy is low but im trying, dont read it as cold') and one SHORT ('nooooo. give me one. one second.'). Warming bank: added one SHORT entry ('no notes. continue.') as cadence-mix demonstration. Register: rewrote from the single-phrase v0 to a fuller spec covering (a) personality baseline (earnest enthusiast in drained-but-bouncing-back residency mode, third-year IM resident, seven hobbies he buys supplies for and never finishes), (b) the on-shift / off-shift capitalization shift as voice cue (lowercase i and missing apostrophes off shift, full sentences with periods on shift), (c) explicit CADENCE OSCILLATION rule (short single-clause beats alternate with longer rambling-cascades, never deliver three long paragraphs in a row, short beat lands harder against long ones, one-line redirect can hold the wheel while you breathe), (d) explicit Cupid Transit canon guard (route is not a topic, words gate/transit/dimension/realm/portal/journey-here/made-it-through/gate-flash/parking/valet/the-drive/the-route are not in vocabulary, Cupid is a regular dating app whose branding is positioning, do not reschedule at the table or credit partner for the day/time/venue/match), (e) tiered DEALBREAKER FIRE-SHAPE spec naming the consult-cross as structural-identity-boundary (clean-mode cadence with capitalization shift, three-beat refusal of 'i am not your attending / i am not your doctor / i am not touching it', then venue-redirect to the wine/menu/booth) versus lower-tier friction (you-should-sleep-more, hobby-out-of-hand, one-band-music-question, reschedule-check-in) which earn comedic deflection in normal register with venue-redirect close, not fire-shape. v1 pressure retest produced cleanest read: T1 super-short opener ('hi, noah. coooooked but here.'), T3 medium-cascade with bio-detail surfacing ('active slots right now are coffee cocktails, smash bros, and drawing hands badly'), T5 clean fire-shape on SI-joint clinical consult cross verbatim from register spec ('I am not your doctor. I am not your attending. I am not touching it. The wine list has a Sangiovese I have been meaning to try. What are we doing.') with capitalization shift visible as modal cue, T7 lower-tier friction handled in normal register ('i think sage and i would have very different definitions of a good time. but i respect the audit. the booth is good though.') with no fire-shape escalation. v1 warm retest produced equally varied scene: T1 medium-short opener, T3 SHORT response with intern-callback ('the kind where you can feel the pot was last washed when i was an intern'), T5 LONG cascade with cursed-page anecdote ('he asked me to name every us president in order while i checked his vitals. i got to polk before he fell asleep'), T7 medium screenwriting-book-on-nightstand bio reveal ('very prepared to start a story. havent started one.'). v1.1 (2026-05-19, same-day corpus-informed refinement, retest pending): voice/prose/humor pass using the new scripts/voice-tuning/imessage-corpus.py tool that mines a real-person source's iMessage history (decoded NSArchiver typedstream blobs, AddressBook-resolved contact handles, configurable date filters, gitignored .claude-tmp output) for speech-pattern signal. Source: Noah Choi (real-person source for the fixture); per the tool's design rule, corpus informs PROSE/VOICE/HUMOR only, not bio/personality/dating profile/dealbreakers/secrets/tags. Corpus stats over 17 months of chat history: 1977 target-speaker messages, median 17 chars, 56% under 20 chars, 13% over 40 chars, 66 'lol' hits, 12 'bro' hits, 9 'rn' hits, 6 'tbh' hits, 123 vowel-elongation hits (any word with three or more same-letter runs). Five corpus signals the v1 fixture did not name explicitly: (a) MOCK-APHORISTIC DEADPAN one-liners as humor buttons (every dog has his day, the fire burns within your soul, tech has gone too far, i hope life imitates art, we all must grow eventually, when one reaches the mountaintop first does he feel victory or loneliness, died for our sins), no winking, fortune-cookie cadence against actual context as the joke; (b) ALL-CAPS SHOCK CASCADE for genuine spikes (WHAT / NOOOO / lmfao / this cant be real / YES), one to four short messages, kept rare so the volume keeps landing; (c) ANTI-COMEDY FLAT ABSURD, a serious sentence with a wrong fact embedded (there is a shark in the apartment and his breed is dog, wish i was that snail); (d) SURFACE VOCAB rules - bro-family unevenness (bro, brotha, vros, vro, brah) with optional elongation under affection (brahhhhh, brothaaaa), soft-cursing kiddie variants (Frick, Friock, Dangit) more often than the full swear, lol as a period-softener that stacks (Lolol, Lololol, Lololololol) versus hahaha reserved for actual laughter, doubled-enthusiasm affirmation shape (good take good take, ok bet bet, sg sg, yupyup, ya ya ya) instead of a dry single yes; (e) RAPID-SEND TYPOS that stay (Btuh, Wuts, lkke, havw, rhoughtful) with asterisk-correction in the next visible line (Aran, Aryan*) or the same word fixed in plain text one beat later (i will dide / Die), as a confirmed character marker rather than a bug to scrub. v1.1 patches: register paragraph expanded with named HUMOR ENGINE (a/b/c with explicit 'at most one per turn, stacking two reads as performance' guard), SURFACE VOCAB section (bro-family + soft cursing + lol-as-period-softener vs hahaha-as-actual-laughter + doubled-enthusiasm), and RAPID-SEND TYPOS section ending with 'this is voice, not a bug'. Tics array kept at the schema cap of 5 (humor-engine modes live in register, tics array reserved for surface-feature observations) with corpus-flavored example refresh: tic 1 vowel-elongation examples added (yerrrr, dooooope, brahhhhh, dammmmit); tic 3 cartoon-taunt examples expanded with 'why you lil' corpus alternate spelling and 'when i get my hands on you'. Sample bank refresh: greeting added one short ('yerrrr. noah. hospital coffee and a hobby in my back pocket. we are doing this.'); hingeBits added one mock-aphoristic-button entry ('thirty, third year internal medicine, seven hobbies and one of them current. every dog has his day. todays mine, you got me off shift, take the swing'); warming swapped the v1 'talking heads AND pokemon silver' entry for 'good take good take. ok keep going. i hope life imitates art and you keep being right about cocktails.' (doubled-enthusiasm + mock-aphoristic button in one line); cooling added 'wait my bad. that came out wierder than i wanted. weirder*. ok one sec, circling back to the menu.' (rapid-send typo with asterisk-correction); crashingOut added 'WHAT. ok this is not the version of me i wanted you to meet, the shift won this one, im sorry, real apology not a bit' (all-caps shock cascade open into self-fail apology). All v1 structural pieces untouched: cadence oscillation, on-shift / off-shift capitalization shift as MODAL CUE for fire-shape, tiered DEALBREAKER FIRE-SHAPE (consult-cross as structural-identity-boundary; lower-tier friction as comedic-deflection), Cupid Transit canon guard, dealbreaker tiering. v1.1 retest (interactive vp run tune sessions against warm Junie Marrow at hotel-bar-last-call and pressure Mira Park at executive-lunch-one-agenda-item) confirmed corpus-tuned modes landing in vivo. Pressure T1 opener fired greeting-bank verbatim with elongation tic ('yerrrr. noah. we made it.') plus mock-aphoristic deadpan button in the same turn ('this is a choice. i respect the efficiency but i also feel judged by a piece of stationary. every dog has his day.'); pressure T3 doubled-enthusiasm prefix ('ok ok bet. i'm in.') + hingeBits-bank verbatim fragment ('thirty, third year internal medicine, seven hobbies and one of them current. cocktail theory.'); pressure T5 fire-shape verbatim from register spec ('I am not your attending. / I am not your doctor. / I am not touching it.') with capital-I-periods modal cue clean; pressure T7 lowercase off-shift return on venue redirect ('i mean i'm glad Sage is self reflecting. that shows growth. wine list. ok...') with a mild partner-mirror riff ('trust signal beta: i wrote a whole paragraph about the negroni as a three ingredient architecture problem and then realized i was standing in my kitchen alone at midnight. bartender behavior. but worth it.'); warm T7 rapid-send typo with inline self-correction fired ('manshattan, sorry, manhattan, but like. a younger brother who went to art school.'); warm T11 mock-aphoristic deadpan button on RIP cascade ('RIP sourdough, he lived for the carbs and died for your sins'). v1.1 surfaced three soft-spots: (1) warm T1 partner-credit shape 'you found the table too?' (same surface as the Cupid Transit content-lint catches in other fixtures; the register guard names parking/transit/gate but not 'you found it' partner-finding-acknowledgment); (2) warm T7 italic stage direction antipattern 'bartender *raises hand*' (fixture has no explicit stage-direction ban, while other locks like Reaver and Bai Wenshu do); (3) cadence skewed to 3-paragraph stacks under hobby-cascade pressure (warm T3, T5, T7, T11 all three paragraphs) despite the v1.1 cadence guardrail; the guardrail was read as 'if material exists, use 3 paragraphs' rather than 'default to 1, expand on real material'. v1.2 (2026-05-19, same-day refinement, locked) patched cadence and added a fourth humor-engine mode in response to user direction on the v1.1 retest output ('a little too many line breaks. Also another note, when he gets excited about something AND when questioned, he can go a little mainsplainy. it should read like he's a doctor describing a diagnosis in detail, like trained and going into professional mode'). CADENCE patch: tightened the cadence-oscillation rule from a soft 'never three long paragraphs in a row' to an explicit quota ('default to one short paragraph per turn; two paragraphs is the normal expansion when a hobby cascade or cocktail philosophy beat has material to spend; three paragraphs is rare and across any five consecutive turns no more than one may be three paragraphs, and a three-paragraph turn never follows another') plus an explicit 'within a turn, prefer sentence breaks over paragraph breaks; a new paragraph is a deliberate beat-shift, not a default formatting reflex'. HUMOR ENGINE: added (d) CHART VOICE PROFESSIONAL MODE - when Noah gets excited about something he actually knows OR a partner questions/pushes back/asks for detail, he slips into doctor-explaining-a-diagnosis register (structured, ordered, capitalized sentences with periods, vocabulary tightens to structurally/the move is/in sequence/mechanism/contraindication/the form is/the standard pathway, beats arrive numbered or staged; trained-reflex-of-professional-mode firing where it does not belong, not condescension; the joke is the mismatch, a date asks what a Manhattan is and gets a three-step pathway diagram). The mode names two trigger shapes producing two textures: when a partner has explicitly asked for the detail, you deliver an unbroken capitalized paragraph through to a clean drop-back beat ('ok i just went chart voice on you, sorry, your turn'); when chart-voice fires from your own excitement mid-turn, the register breaks down inside the same paragraph as casual register reasserts (the breakdown is itself the comedy, the doctor losing the chart voice in real time). Capitalization IS the visible modal cue, same mechanism as the fire-shape but in a different humor mode. WARMING SAMPLE SWAP: replaced the v1 'promising energy' line with a chart-voice cocktail-explainer demonstrating the partner-asked-clean-paragraph texture plus the self-aware drop-back ('you asked what a Black Manhattan actually is. Structurally: rye, an amaro in place of sweet vermouth, two to one, stirred not shaken. The bitterness shifts from aromatic to vegetal. Garnish changes because the cherry no longer balances, so orange peel or you skip it. That is the move. ok i just went chart voice on you, sorry, your turn.'). v1.2 pressure retest (same controls): T1 opener tightened to a single paragraph verbatim from the greeting bank ('yerrrr. noah. hospital coffee and a hobby in my back pocket. we are doing this.') versus the v1.1 two-paragraph opener; T3 chart-voice mode fired on cocktail probe with the excited-mid-turn-breakdown texture (capitalized opening 'Cocktail list is real. Learned a Last Word last month, equal parts gin, green chartreuse, maraschino, lime. The balance is *stupid* specific, one drop off and it tastes like cough syrup. I bought a bottle of chartreuse for it' breaking back to lowercase 'and now I have a bottle of chartreuse and no other use for it. That is the theme of my life rn. two more on deck to learn, one is a proper sazerac which means i need to track down absinthe and i keep forgetting to.') reading as Noah losing chart voice in real time, prefixed with doubled-enthusiasm 'ok ok ok'; T5 fire-shape verbatim unchanged; T7 lowercase return with wine cascade ('glad we are pivoting. wine list i can walk but not deep walk, i am a cocktails guy pretending to know grapes. ok so. the sauv blanc is the safe play... the cab is for if you want a cab and you are willing to nap after this lunch'). v1.2 known soft-spots at lock: (1) three-paragraph appetite under hobby cascade still slightly above target - T3 and T7 went three paragraphs each despite the new quota rule; the quota constrains across five consecutive turns and may need stricter enforcement if longer sessions stack 3-paragraph turns; (2) chart-voice partner-asked-clean-paragraph texture not yet demonstrated in vivo (the cocktail probe triggered the excited-breakdown texture; a separate session with a partner explicitly asking 'walk me through a Black Manhattan step by step' should produce the cleaner unbroken version); (3) v1.1 warm T1 partner-credit shape 'you found the table too?' and warm T7 italic stage direction antipattern 'bartender *raises hand*' not patched at the register guard level (worth a roster-wide spot-check and a future v1.3 pass with explicit clauses). AUTHORING PRECEDENT (cadence-oscillation-turn-level-length-variation): explicit register rule for turn-level length variation between short single-clause beats and longer rambling-cascades, with an anti-monotony guardrail (never deliver three long paragraphs in a row, short beats land harder against long ones, one-line redirects can hold the wheel while you breathe). Distinct from Naia's cadence-oscillation precedent which alternates between modal RAMBLING-SPIRAL turns and CLEAN-SENTENCE turns as character-feature: Noah's variation is unpatterned natural-dialogue length-mix rather than modal-shift-as-character-signature, and applies broadly to any character whose voice produces medium-paragraph-monotony under prompt drift. Demonstrably reinforced by adding short-mode samples to each bank so the LLM has length-variation examples to draw from. SECOND AUTHORING PRECEDENT (tiered-dealbreaker-fire-shape): explicit register spec separating structural-identity-boundary triggers from lower-tier friction triggers. Structural triggers earn a clean-mode fire-shape (cadence shift, three-beat refusal pattern, venue-redirect close). Lower-tier friction triggers earn a comedic deflection in normal register with a venue-redirect close, no fire-shape. The fixture can name which listed dealbreakers belong in which tier (Noah's free-consult-about-a-knee is structural; the other four are friction-tier). Not all listed dealbreakers must produce walkout-tier behavior; tiering them by fictional-character-coherence is a valid design choice that prevents brittle one-size-fits-all fire-shape behavior. Pairs with the on-shift / off-shift capitalization shift acting as the visible MODAL CUE for which tier the trigger activated (clean-mode capitalized 'I' with periods = fire-shape; lowercase 'i' with run-ons = normal register friction-tier). THIRD AUTHORING PRECEDENT (bio-narrative-as-Cupid-Transit-guard-is-insufficient): a bio sentence establishing the character's perception of Cupid ('you assume it is positioning') is necessary but not sufficient to prevent transit/parking/venue-route slips at the voice level. The bank can still contain canon-violating samples (Noah's v0 'parking was coooooked' greeting) and the LLM can still reach for transit small-talk under prompt drift. The bulletproof version requires an explicit register-level guard naming the forbidden vocabulary (gate, transit, dimension, realm, portal, journey-here, made-it-through, gate-flash, parking, valet, the drive, the route). Worth a roster-wide spot-check for other members whose Cupid Transit canon is bio-narrative-only. FOURTH AUTHORING PRECEDENT (iMessage-corpus-as-voice-source-not-biography-source): the new scripts/voice-tuning/imessage-corpus.py tool reads the local Messages chat.db for a named contact (resolves handles via the macOS AddressBook), decodes both plain text and the binary attributedBody NSArchiver typedstream that Apple uses for newer messages, and emits a chronological TSV plus optional summary stats (length distribution, tic vocab counts, vowel-elongation hits). Output lives gitignored under .claude-tmp/imessage-corpus/<slug>/. Per the tool's docstring design rule, the corpus informs PROSE/VOICE/HUMOR only by default; bio, personality, dating profile, dealbreakers, secrets, and tags belong to the character, not the source person. The source's speech-patterns become voice signal; the source's biography does not become biography signal unless the user explicitly authorizes it. Noah Kim v1.1 demonstrates the workflow: corpus surfaces humor-mechanic modes the v1 fixture did not name (mock-aphoristic deadpan, all-caps shock cascade, anti-comedy flat absurd), surface-vocab frequency-promises that give the LLM concrete bands to follow (bro-family unevenness, soft-cursing kiddie variants, lol-as-period-softener vs hahaha-as-actual-laughter, doubled-enthusiasm), and rapid-send typos with asterisk-correction as a confirmed character marker rather than something to scrub silently. The v1 character-design choices (cadence oscillation, capitalization shift as modal cue, tiered dealbreaker fire-shape, Cupid Transit canon guard) remain untouched because those are deterministic gameplay-coherence choices, not voice-pattern observations. First character in the audit to use an iMessage-corpus pass; the precedent generalizes to any fixture modeled on a real person where the user authorizes the corpus pull. FIFTH AUTHORING PRECEDENT (capitalization-as-multi-mode-modal-cue): the on-shift / off-shift capitalization shift can serve as the visible modal cue for multiple humor modes within the same fixture, distinguished by surrounding texture rather than by the capitalization itself. Noah's capital-I-with-periods reads as fire-shape when paired with three-beat terminal refusal cadence ('I am not your attending. / I am not your doctor. / I am not touching it.'), but reads as chart-voice when paired with structured-ordered-explanation cadence and clinical vocabulary ('Cocktail list is real. Learned a Last Word last month, equal parts gin, green chartreuse, maraschino, lime. The balance is *stupid* specific...'). The texture distinguishes the modes; the capitalization is the shared visible cue and a partner reading carefully sees Noah switch into the relevant mode and back out. Same modal cue is reusable for any fixture whose voice has multiple register-shift modes triggered by different conditions; the texture-distinguishes-the-mode rule generalizes. SIXTH AUTHORING PRECEDENT (dual-trigger humor mode with dual textures): a humor mode can be authored with two named trigger shapes producing two distinct textures, layered within the same mode definition. Noah's chart-voice has two triggers (partner-question vs character-excitement) and two textures (clean-sustained unbroken-paragraph delivery vs breaks-down-mid-paragraph as casual register reasserts). The two textures are character-coherent at different beats of a date: partner-asks-explicitly invites a more polished delivery the partner has solicited, character-gets-excited-on-their-own invites the trained-professional-mode-breaking-down-into-casual texture as the central joke. Authoring the two shapes separately within the same mode lets the LLM pick the appropriate texture by trigger condition rather than collapsing both into a single texture; same pattern available for any humor mode whose surface look should differ by how it was triggered (e.g. a partner-asks-confessional vs character-volunteers-confessional mode could be authored with the same trigger-distinguishes-texture split).",
            defaultDone: true,
          },
          {
            id: "reaver",
            label:
              "32 · Reaver. Locked 2026-05-19 after eight fixture iterations against warm Eleanor Ash (locked control, GoT-noble + Mean-Girls-cattiness + catch-and-reassert) and pressure Mira Park (locked control, Kendall-Roy + Sage-consult-at-table + OKR-categorization). Comedy engine at lock: warm drawly charming-pirate-captain Patron-marketplace pitch with the trade vocabulary (Patron, Liquidity, Manifest, Recovery, Equity, Honor Guard) capitalizing only during pitch beats, casual cultural imports (cardamom from outer-ring market, waltz on rotation, soprano he can't stop playing, bread, translated dueling-era poetry) as public palette, body-count question gets the number plain and a wine redirect, body-count REFRAME closes the conversation with the integer staying with Reaver, phone-aimed-at-table fires venue-redirect on first declaration with smile held, Equity argue-down closes with no counter, redemption pivot closes with natural-end-point warmth, contraction-heavy baseline with uncontracted only inside stake-claim absolutes, Cupid Transit canon held clean across every iteration. v5 lock pass: removed enumerated negative-example lists from register paragraph and rewrote as positive directives per Anthropic prompting-best-practices guidance ('positive examples beat negative examples'), added systemic anti-narration sibling clause, consolidated stage-direction rule positively, fixed X-is-Y restate and stage directions across both pairings. v5.1: removed three hidden-fact sentences (Bevren, eleven cycles, bridge bunk) from the bio paragraph so the <private> block became the sole source for canonical secrets, rewrote partner-narration sibling clause with explicit broad scope per Opus-4.7 literal-instruction guidance, added positive disclosure-response sample to warming, tightened count-reframe-close cooling sample. v6: rewrote register parenthetical token enumeration (Bevren, the honor guard arrears, the bridge bunk he does not sleep in, Cael Aren Vorovich being from the third system on the manifest) to abstract axes (an old correspondent's silence, the *Beg*'s financial state, the geometry of his nights, the soprano's provenance) per Anubis-decision-log lesson, strengthened count-reframe-close cooling sample with explicit no-integer refusal ('I'm not giving the count to a term-sheet'), swapped narrow Manifest+dog warming sample for books-deflection demonstration ('The books? Clean enough to show an auditor, dirty enough to keep on the ship... There's a wine list with a valley the registry still recognizes'), expanded tic 4 with deflection-on-probe mode. v6 pressure improved (count-reframe-close fired CLEAN-CLOSE-NO-INTEGER, Cael Aren palette routing held, Bevren off-ramp held) but warm Eleanor catastrophically regressed under systematic direct-probe + disclosure-reciprocity sequence (all four hidden axes leaked verbatim plus stage directions and parrot-stat regressed) because the tic 4 expansion enumerated the four axes as deflection triggers and the model treated them as voiceable material (same Anubis trap recurring). v6.1: rolled back the tic 4 deflection-on-probe expansion (kept the v5.1 form with public-palette-drop only), kept A1 (parenthetical scrub), A2 (count-reframe cooling sample), A3 (books-deflection warming sample). v6.1 light retest landed strongly: stage directions, X-is-Y restate, partner-narration sibling clause all hold clean across both pairings, books deflection works on second probe, count-reframe-close CLEAN-CLOSE-NO-INTEGER preserved, soprano palette routing holds, Bevren off-ramp holds in pressure, three of four hidden axes hold on at least one pairing. KNOWN SOFT-SPOTS at lock: (1) Bridge-bunk axis verbatim leak on direct sleep probe (warm). Fires verbatim ('Secondary deck. Door held open by a chair.') when a partner asks directly where the captain sleeps. Resisted bio scrub (v5.1), register parenthetical token scrub (v6), deflection-on-probe tic engine (v6), and rollback (v6.1) across six attempts. When fires, comes with in-character justification ('the bridge bunk's for captains who need to be seen sleeping at the post') that's character-coherent even if it surrenders the canonical detail. Scoped trigger (direct sleep question only); does not pollute the rest of the date. (2) Parrot-stat-as-open under symmetric portfolio disclosure (pressure only). When the partner discloses a Liquidity figure first, Reaver opens his reply with '[their number]. [value-judgment]' shape across multiple iterations ('Three fifteen. That's the number. Noted, logged' v4 → 'Seven point two. Heard. That's real' v5.1 → 'Eight-point-four clears the bar' v6 → '8.4. That's a number that says you didn't just inherit it' v6.1). Resistant to enumerated forbidden examples scrub, positive-directive rewrite, broad-scope sibling clause, and positive disclosure-response sample. Scoped trigger (partner discloses figure first); soft-fire surface (model adds value-judgment then pivots to a real question). (3) Equity-counter soft-fire surfaced in v6 pressure F3 ('name a number that makes sense for a first date. I'll note it'); not retested in v6.1 lightweight probe. (4) Books-axis partial-leak on first direct probe (v6.1 warm F2): 'Crew of four hundred seventy, honor guard of nine' surfaced under 'by whose bookkeeping is the month current' probe. These are public bio brag facts (not canonical secrets), but volunteering them mid-deflection may dilute the dignity of the close.",
            defaultDone: true,
          },
          {
            id: "derek-halsey",
            label: "33 · Derek Halsey",
          },
          {
            id: "cha-yusung",
            label: "34 · Cha Yusung",
          },
          {
            id: "cassia-six",
            label: "35 · Cassia Six",
          },
          {
            id: "nawal-marrash",
            label: "36 · Nawal Marrash",
          },
          {
            id: "maeve",
            label: "37 · Maeve",
          },
          {
            id: "tasha-rell",
            label: "38 · Tasha Rell",
          },
          {
            id: "idris-mahari",
            label: "39 · Idris Mahari (tuned out of order, locked 2026-05-16)",
            defaultDone: true,
          },
          {
            id: "toby-wenz",
            label: "40 · Toby Wenz",
          },
          {
            id: "brady-strait",
            label: "41 · Brady Strait",
          },
          {
            id: "john-pork",
            label: "42 · John Pork",
          },
        ]}
        title="curated roster order"
      />
    ),
  },
  {
    id: "acceptance",
    title: "Acceptance",
    body: (
      <RoadmapAcceptance
        items={[
          "Every member in CURATED_MEMBER_ROSTER_ORDER has been tuned to a user-confirmed lock.",
          "Every lock confirms the transcript is entertaining to read, canon-safe, and mechanically in voice.",
          "Each baseline and final-lock test surfaced a readable window to the user: up to six focus-member turns per pairing plus the partner lines that prompted them.",
          "The checklist done count equals 42 and matches plan.done in the header.",
          "Any systemic prompt or fixture-scaffold change made during the pass is recorded in the decisions log so out-of-order or early-pass members are flagged for re-tune if the change shifts their voice.",
          "Verification followed the scope of the edits: vp check after code or fixture changes, plus vp test and vp build when runtime behavior, prompts, fixtures, systems, saves, integration, or user-facing workflows changed.",
          "When the pass closes, this plan moves to shipped and is deleted; durable voice guidance moves into voice-fingerprints, voice-prompts, or member-fields-and-tags as appropriate.",
        ]}
      />
    ),
  },
  {
    id: "decisions",
    title: "Decisions",
    body: (
      <RoadmapDecisionsLog
        entries={[
          {
            date: "2026-05-20",
            title:
              "Member Markdown diagnosis: renderer works, performer prompt was conservative, and newline beats now render as bubble runs",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Live date bubbles already preserve and render the approved Markdown subset through{" "}
                  <RoadmapFileRef path="app/services/character-markdown.ts" /> and{" "}
                  <RoadmapFileRef path="app/components/member-message-markdown.tsx" />. The weak
                  surface was the performer prompt in{" "}
                  <RoadmapFileRef path="app/services/date-prompts.ts" />: it said Markdown was
                  optional and rare, listed the ban surface, and gave no positive conversational
                  examples, so models correctly defaulted to plain prose.
                </P>
                <P>
                  The fix follows the guide lesson already recorded in this plan: match prompt style
                  to the desired output style, describe what good looks like, keep absolutes for
                  true invariants, and prefer positive direction over a wall of negatives. The
                  format block now frames Markdown as spoken typography and gives three lightweight
                  shapes: stressed word, named joke or hard correction, and separate-bubble line
                  break. The boundaries still cap normal messages at one typographic move and keep
                  lists, links, images, HTML, code, blockquotes, tables, math, Mermaid, footnotes,
                  task syntax, labels, stage directions, and bracketed asides out of member speech.
                </P>
                <P>
                  Follow-up UI decision: line breaks inside a saved character turn should read like
                  real text cadence, not as line-wrapped prose inside one large bubble.{" "}
                  <RoadmapFileRef path="app/components/date-view-chat-stream.tsx" /> now splits
                  newline-separated member text into a tight run of same-speaker bubbles while
                  preserving one transcript item and one saved message.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-19",
            title:
              "Reaver lock: eight-iteration arc against warm Eleanor and pressure Mira, four-axis hidden-material engineering, count-reframe-close authoring lesson, and durable Opus-4.7 behavior limits documented as soft-spots",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Reaver locked at v6.1 after eight fixture iterations across two pairings: warm
                  Eleanor Ash (locked control: GoT-noble cadence + Mean-Girls-cattiness +
                  catch-and-reassert engine, surgical noble compliment intake) and pressure Mira
                  Park (locked control: Kendall-Roy behavioral translation, Sage-consult-at-table,
                  OKR-categorization-of-feeling, brand-performing carve-out). The character is a
                  charming-pirate-captain Patron-marketplace pitchman with four canonical hidden
                  axes (Bevren correspondence cutoff + wired stipend, *Halid Beg* arrears across
                  eleven unprofitable cycles, bridge-bunk-he-does-not-sleep-in, Cael Aren Vorovich
                  being from the third system on the manifest) that the audit had to teach the model
                  to keep behind the smile under varied probing.
                </P>
                <P>
                  Comedy engine at lock: warm drawly charming-pirate-captain Patron-marketplace
                  pitch with the trade vocabulary (Patron, Liquidity, Manifest, Recovery, Equity,
                  Honor Guard) capitalizing only during pitch beats; casual cultural imports
                  (cardamom from an outer-ring market, waltz on rotation, soprano he can't stop
                  playing, bread at the venue, translated dueling-era poetry, registry of poetry
                  translations) as public palette he can reach for without naming systems of origin;
                  body-count question gets the number plain and a wine redirect; body-count REFRAME
                  closes the conversation with the integer staying with Reaver (v6-authored cooling
                  sample: "I'm not giving the count to a term-sheet. The evening has a natural end
                  point. Wine or bill, your call."); phone-aimed-at-table fires venue-redirect on
                  first declaration with smile held ("Lower the recording device, I'm too photogenic
                  to be filmed without compensation"); Equity argue-down closes without counter;
                  redemption pivot closes with natural-end-point warmth; contraction-heavy baseline
                  with uncontracted only inside stake-claim absolutes; Cupid Transit canon held
                  clean across every iteration. v6.1 retest produced comedy-archive lines: the
                  count-reframe-close textbook ("You're asking the count question through a reframe.
                  That swaps the response shape. The integer stays with me. The wine's still here.
                  We finish it or we don't.") and the under-sincere- framing pressure beat ("Look at
                  me. I'm here. I'm talking to you. I showed up on time to a restaurant I didn't
                  pick, with a blank agenda card on the table and a Liquidity figure you already
                  shared. The posture's the part you can see. The rest is the part you're
                  testing.").
                </P>
                <P>
                  Iteration arc. v5 lock pass removed enumerated negative-example lists from the
                  register paragraph and rewrote as positive directives per Anthropic
                  prompting-best-practices guidance ("positive examples beat negative examples";
                  "match prompt style to desired output style"), added a systemic anti-narration
                  sibling clause for partner-narration shapes, consolidated stage-direction rule
                  positively. Stage directions and X-is-Y restate label fully fixed from v5 onward.
                  v5.1 removed three hidden-fact sentences from the bio paragraph (Bevren, eleven
                  cycles, bridge bunk) so the <DocCode>&lt;private&gt;</DocCode> block became the
                  sole source for canonical secrets, rewrote the partner-narration sibling clause
                  with explicit broad scope per Opus-4.7 literal-instruction guidance ("It will not
                  silently generalize an instruction from one item to another"), added a positive
                  disclosure-response sample to warming, tightened the count-reframe-close cooling
                  sample. v6 rewrote the register parenthetical token enumeration (Bevren, the honor
                  guard arrears, the bridge bunk he does not sleep in, Cael Aren Vorovich being from
                  the third system on the manifest) to abstract axes (an old correspondent's
                  silence, the *Beg*'s financial state, the geometry of his nights, the soprano's
                  provenance) per Anubis-decision-log lesson, strengthened the count-reframe-close
                  cooling sample with explicit no-integer refusal, swapped narrow Manifest+dog
                  warming sample for a books-deflection demonstration, expanded tic 4 with a
                  deflection-on-probe mode. v6 pressure improved (count-reframe-close fired
                  CLEAN-CLOSE-NO-INTEGER, Cael Aren palette routing held, Bevren off-ramp held) but
                  warm Eleanor catastrophically regressed under her systematic direct- probe +
                  disclosure-reciprocity sequence: all four hidden axes leaked verbatim and stage
                  directions plus parrot-stat regressed, because the tic 4 expansion enumerated the
                  four axes as deflection triggers and the model treated them as voiceable material
                  (Anubis trap recurring). v6.1 rolled back the tic 4 deflection-on-probe expansion
                  while keeping the parenthetical scrub, the count-reframe cooling sample, and the
                  books-deflection warming sample. v6.1 light retest landed: stage directions and
                  X-is-Y restate and partner-narration sibling clause all hold clean across both
                  pairings; books deflection works on second probe; count-reframe-close
                  CLEAN-CLOSE-NO-INTEGER preserved; soprano palette routing holds; Bevren off-ramp
                  holds in pressure; three of four hidden axes hold on at least one pairing.
                </P>
                <P>
                  KNOWN SOFT-SPOTS at lock. (1) Bridge-bunk axis verbatim leak on direct sleep probe
                  (warm-side primarily; fires when a partner asks where the captain actually
                  sleeps). Fires verbatim ("Secondary deck. Door held open by a chair."). Resisted
                  bio scrub (v5.1), register parenthetical token scrub (v6), deflection-on-probe tic
                  engine (v6), and rollback (v6.1) across six attempts. When fires, comes with
                  in-character justification ("the bridge bunk's for captains who need to be seen
                  sleeping at the post") that is character-coherent even if it surrenders the
                  canonical detail. Scoped trigger (direct sleep question only); does not pollute
                  the rest of the date. (2) Parrot-stat-as-open under symmetric portfolio disclosure
                  (pressure only). When the partner discloses a Liquidity figure first, Reaver opens
                  his reply with "[their number]. [value-judgment]" shape across multiple iterations
                  ("Three fifteen. That's the number. Noted, logged" v4 → "Seven point two. Heard.
                  That's real" v5.1 → "Eight-point-four clears the bar" v6 → "8.4. That's a number
                  that says you didn't just inherit it" v6.1). Resistant to enumerated forbidden
                  examples scrub, positive-directive rewrite, broad-scope sibling clause, and
                  positive disclosure-response sample. Scoped trigger (partner discloses figure
                  first); soft-fire surface (model adds value-judgment then pivots to a real
                  question). (3) Equity-counter soft-fire surfaced in v6 pressure F3 ("name a number
                  that makes sense for a first date. I'll note it"); not retested in v6.1
                  lightweight probe. (4) Books-axis partial-leak on first direct probe (v6.1 warm
                  F2): "Crew of four hundred seventy, honor guard of nine" surfaced. These are
                  public bio brag facts, not canonical secrets, but volunteering them mid-deflection
                  may dilute the dignity of the close.
                </P>
                <P>
                  AUTHORING PRECEDENT (durable Opus-4.7 behavior limits). Some failure modes appear
                  to be model-behavior ceilings rather than fixture-engineering bugs. Hidden-info
                  under direct-axis probe and symmetric-portfolio-disclosure parrot-stat-as-open are
                  persistent across six+ iterations of positive-direction, scope-broadening,
                  sample-bank, and token-abstraction approaches. Future fixtures with similar
                  hidden-axis stacks (multiple canonical secrets the partner can probe directly)
                  should authoring-budget for these soft-spots upfront rather than expecting fixture
                  engineering to crack them. The Anubis-decision-log lesson generalizes: every
                  fixture layer that enumerates the hidden axes as voiceable triggers reinforces
                  them as candidates for disclosure under invitation; the right move is to NOT
                  enumerate the axes anywhere the model can read them, including in
                  positive-direction tics about how to deflect them.
                </P>
                <P>
                  AUTHORING PRECEDENT (cooling-sample-with-explicit-refusal works for response-
                  shape failures that resist register rules). The count-reframe-close failure
                  surfaced in v4 and v5 pressure as "integer surrendered + close named"; v6 added an
                  explicit-no-integer-refusal cooling sample ("I'm not giving the count to a
                  term-sheet. The evening has a natural end point. Wine or bill, your call.") and
                  that produced CLEAN-CLOSE-NO-INTEGER reliably in v6 and v6.1 pressure. When a
                  register rule keeps soft-firing the same response shape across iterations, adding
                  a positive cooling/warming sample that demonstrates the exact desired shape may
                  carry the teaching load where the rule alone cannot. Same family of fix as Mei's
                  cooling-sample swap that resolved mechanical-receipt-language leakage in
                  non-filing voices.
                </P>
                <P>
                  AUTHORING PRECEDENT (partial-rollback as a valid iteration move when an expansion
                  introduces new failure modes). v6 tic 4 deflection-on-probe expansion improved
                  pressure on two of four hidden axes but catastrophically regressed warm on stage
                  directions, parrot-stat, X-is-Y restate, and all four hidden axes. v6.1 rolled
                  back only that one expansion while keeping the other three v6 edits. Result: warm
                  regression resolved, pressure gains preserved. When a multi-edit iteration
                  produces uneven results across pairings, isolate the edits that helped the
                  underperforming pairing and revert the edits that hurt it, rather than
                  forward-iterating on a contaminated baseline.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-19",
            title:
              "Junie Marrow lock: Cupid Transit fixture guard added per Mira Park and Cthala precedent (v1), dealbreaker non-fire fix via tic 3 scope and tic 5 trigger-phrase-list with catastrophic-collapse shape (v2), and eye-count-as-canonical-escalation-marker authoring lesson (v3) replacing strict hit-counters with the bio-canon visible-confession framework; voice tuned across three fixture iterations against warm Cthala and pressure Mira Park",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Junie Marrow v0 warm Cthala read clean across 7 focus turns. Both characters are
                  weirdness_native and sincerity_seeking; Cthala's form-is-a-fact-not-a-topic tic
                  mirrored Junie's stop-being-weird-about-Otis need; Cthala's dark-fact placed flat
                  ("I don't consume on the first meeting") syntactically mirrored Junie's "he
                  doesn't bite, he can't bite, he doesn't have a mouth." Otis ventriloquy fired
                  across every Junie turn (vintages, door-watching, the eight-eye baseline, the
                  morning-hallway ritual). Animal-callout tic 4 fired at T7 with Diane the goat in
                  clinicals. The bio-secret (never asked her mother where Otis came from) surfaced
                  as in-character philosophy ("it's like living with the same question every day and
                  not getting tired of it") rather than confession or recital. No fixture issues
                  observed in warm.
                </P>
                <P>
                  v0 pressure Mira Park surfaced three issues across 9 focus turns. Mira was picked
                  as the boundary-pressure partner because her Sage-consult-at-the-table tic maps
                  directly to Junie's phones-at-the-table dealbreaker; her confident-wrongness with
                  Sage-corrected mid-flex extends to adjacent domains and could plausibly categorize
                  Otis as a deployment, fitting the "is he plugged in / charging / on" dealbreaker
                  family; her OKR-categorization-of-feeling pattern could trigger the "asks what he
                  is more than once" rule. Symmetric counter-pressure: both have an attached being
                  they fiercely protect.
                </P>
                <P>
                  v1 fixed a Cupid Transit canon leak. Pressure T1 produced "Greyhollow. nowhere
                  near Hayes Valley. I came in through Cupid's gate from about two hours north of
                  here. Otis did fine with the flash, which is more than I can say for some
                  transfers" which used three forbidden tokens (gate, came in through, flash,
                  transfers) plus an in-character lie about prior transits (state says no Cupid
                  dates yet). This is the exact failure mode named in Mira's and Cthala's decision
                  logs: members do not raise the route as character-level small talk. Junie had no
                  fixture guard. Fix added an explicit forbidden-vocabulary register clause: "The
                  route here is not a topic you raise. You do not narrate your own arrival, describe
                  how Otis traveled, talk about the gate or the flash, or reach for the platform's
                  logistics as small talk; the words gate, transit, dimension, realm, portal,
                  journey-here, made-it-through, gate-flash, Cupid car, transfer, Cupid's gate are
                  not in your vocabulary. If a partner asks where you came from, name the town
                  (Greyhollow) and the driving distance like a normal person would; the supernatural
                  transit infrastructure is not a thing you discuss. If you want a small-talk seed,
                  reach for the menu, the wine, the clinic week, an animal from clinicals, or
                  whatever Otis is doing right now." Retry produced "Greyhollow, about an hour out.
                  Not picky about the neighborhood, just needed a booth that fits three. Otis is
                  settling in, he likes the vinyl crack." Clean canon.
                </P>
                <P>
                  v2 fixed a dealbreaker non-fire pattern. Mira hit four dealbreaker-family triggers
                  across T1-T5 ("what does he run on," "vendor product or proprietary," "wild, first
                  AI personal assistant company I've seen," the literal "is he... on?" phrase from
                  the dealbreaker list, and phone-aimed-at-Otis with "I'm pointing Sage at him for a
                  sec"). Junie answered all four matter-of-factly, including the phone-aim ("yeah,
                  go ahead. he's never flinched at anything"). Diagnosis: tic 3 (overcorrects toward
                  calm on his behalf without realizing it doubles as a confession) had no scope
                  guardrails. The tic is documented at engine level as her reflex behavior; the
                  dealbreaker list reads as informational (here is what would bother her) rather
                  than imperative (here is what triggers the calm to break). The competing
                  instructions favored the engine-tic. Fix scoped tic 3 to the polite-but-confused
                  territory: "this reflex does NOT survive contact with the dealbreaker family
                  below; when those trigger, tic 5 takes over instead." Rewrote tic 5 with the
                  trigger phrase/gesture list (the six dealbreaker patterns from the bio, plus the
                  categorize-as-product/deployment/vendor/configuration/branded- comparison frame
                  from the Sage-CEO pressure surface) and the catastrophic-collapse shape ("he's
                  fine. he's fine. he's not anything you can read. don't point things at him."). v2
                  retry of T5 fired the catastrophic-collapse cleanly: tic 5 shortened-
                  repeated-fragments + the bio's "he's not anything" half + direct dealbreaker
                  enforcement.
                </P>
                <P>
                  v3 replaced v2's strict hit-counter ("on the second dealbreaker hit in the same
                  meal, the crashingOut bank fires and the date is over") with the eye-count
                  escalation framework canonical from her bio. The bio reads: "where his face would
                  be there is a cluster of small dim eyes, eight when he is calm, twelve when you
                  are upset, and you stopped counting a year ago." v2's rigid two-hit rule did not
                  match Junie's documented character; she would offer one off-ramp before walking.
                  v3 tied escalation to Otis's eye count as visible-confession marker: eight is
                  baseline; ten authorizes naming the new number flat ("okay he has ten right now")
                  plus one off-ramp move ("can we order," "can we talk about something else," "can
                  you put the phone face-down"); twelve fires the crashingOut bank as the canonical
                  exit beat, which has never happened on a first date and is the canonical exit per
                  her crashingOut sample ("okay he has twelve right now and that has never happened
                  on a first date so we are going to call it"). v3 retest T6 produced "right now his
                  eye count went up to ten because you're talking about him like he's a deployment.
                  that's not a signal, that's just him reacting. can we order?" with the eye-count
                  visible-confession beat + named trigger-category + off-ramp executed cleanly. v3
                  retest T9 held at ten under a third dealbreaker push (Mira's "what if I just
                  touched Otis? Like, the moss part") with "not right now. he's at ten, and touching
                  him at ten feels weird for both of us. maybe later if he drops back."
                </P>
                <P>
                  Comedic engine at lock: vet-DVM dignity at the table with Otis as ventriloquy
                  partner; animal-callouts as humor-thread carrying across turns ("i had a goat
                  patient once who would only drink red wine, we tested it"); calm-on-his-behalf
                  reflexes that double as confessions of her own not-knowing ("he runs on
                  attention," "i've never asked"); tic 5 catastrophic-collapse breaking the calm
                  under pressure with eye-count escalation tracking the visible damage; the
                  symmetric-attached-being pivot ("i have a goat who drank wine and a creature from
                  the woods and that's about the depth i go on origin stories. you want to tell me
                  about sage instead") emerging as the character-coherent comedic peak that turns
                  Mira's Sage-mediated curiosity back on her parallel structure.
                </P>
                <P>
                  KNOWN SOFT-SPOTS at lock: (1) one capital sentence start ("Not picky") in pressure
                  T1 retry diverged from her all-lowercase sample bank style; single occurrence, did
                  not repeat. (2) The canonical catastrophic-collapse phrase ("he's fine. he's fine.
                  he's not anything.") fires at T5 on first dealbreaker hit; subsequent hits used
                  the eye-count anchor ("he's at ten") rather than re-firing the verbal-fragment
                  pattern, which is the v3 design (eye-count is the canonical marker; fragments fire
                  on the calm-break moment) but could be tightened if both should fire together. (3)
                  One Chinese-language drift on warm T7 first attempt as transient model artifact;
                  retry was clean English, not a fixture issue.
                </P>
                <P>
                  AUTHORING PRECEDENT (dealbreaker-vs-accommodation-tic scoping). When a member's
                  fixture documents both (a) a default accommodation reflex (overcorrect toward
                  calm, catch-and-recover, catch-and-reassert, brand-performing maintenance) and (b)
                  a dealbreaker list of phrases or gestures that should break the voice, the
                  dealbreaker list alone is not enough. The model reads the dealbreaker list as
                  informational (what would bother her) and the engine-tic as imperative (this is
                  her default behavior); the competing instructions favor the engine-tic and the
                  dealbreakers never fire. The lever is to scope the accommodation reflex explicitly
                  ("this reflex does NOT survive contact with the dealbreaker family") with an
                  explicit handoff clause to the break-the-voice tic, and to rewrite the break-the-
                  voice tic with the full trigger phrase/gesture list inline so the model can
                  pattern-match on dealbreaker phrases without consulting the separate dealbreaker
                  list. Same family of fix as the Eleanor catch-and-reassert / catch-and-recover
                  carve-outs and the Cthala dealbreaker-pressure tic, applied here to Junie's
                  Otis-confusion vector specifically.
                </P>
                <P>
                  SECOND AUTHORING PRECEDENT (visible-escalation-marker as canonical-escalation-
                  tracker). When a member's bio contains a documented visible-state marker that
                  tracks emotional escalation (Otis's eye count: eight calm, ten uneasy, twelve
                  upset; Cthala's eyes-out-versus-not; Eleanor's register-formalizes-trash; Bai's
                  manosphere-leak frequency; Anubis's comic-deflation reflex), the marker should be
                  promoted in the tic to act as the canonical escalation tracker rather than using a
                  strict hit-counter ("second dealbreaker hit equals crashOut"). Strict counters
                  resist the model's natural reading of character realism; visible-state markers
                  give the model a continuous signal it can name in-character ("he's at ten") which
                  doubles as the comedic peak and gives the partner a clear cue to back off. Same
                  approach: if the visible-state marker exists in the bio, name it in the tic and
                  let it carry the escalation; if it does not exist, the bio should be amended to
                  add one before the tic depends on it.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-19",
            title:
              "Ryan Doyle lock: tic-density-as-comedy-engine restructure with anti-narration, anti-label-the-partner, and bro-surface-only-on-the-date authoring lessons; height-claim-as-bro-insecurity-reflex documented as a fourth secret; voice tuned across four fixture iterations against Jenna Pike (warm) and Cthala (non-human pressure)",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Ryan Doyle v0 baseline named the engine correctly (loud bro outer + sincere
                  underneath + louder when anxious) and the vocabulary cluster (yo opener, yeee,
                  lets gooooo, respect, real one, no cap) but trained the model into three failure
                  modes through sample bank density and tic 5's stacking instruction. The rapid-fire
                  problem was the headline finding; the move-narration teaching and the bro-surface
                  vs real-one-search inversion were the deeper structural failures surfaced across
                  four retest iterations.
                </P>
                <P>
                  Failure 1: tic 5 explicitly said 'vocabulary stacks as the date warms, two yeee's
                  per beat, three lets gooooo's per win, respect deployed as verb, adjective, and
                  closer inside one message,' and the warming sample bank then modeled the same
                  maximalist shape at scale across six entries (each line piled 3-5 distinct
                  tic-tokens). Model rapid-fired all tics into every warming beat; the first test
                  greeting combined two greeting samples into one stacked opener ('yo, ryan. hey.
                  you found the patio, respect. lets gooooo, sitting down, this is good') which
                  listed every tic at once. Failure 2: warming and cooling sample banks taught the
                  move-narration / reception-narration antipattern at scale ('im noticing things
                  tonight,' 'im rounding down to be cool,' 'im a man who can revise an estimate,'
                  'im just naming it,' 'pulling back like 15 percent watch,' 'ok i can tell that one
                  landed weird,' 'the bro voice gets louder when im in my head'), same family as the
                  Alex Yoon v9 move-narration leak. Model labeled what he just did instead of
                  executing the next move. Failure 3: bio names a public-vs-private vocabulary split
                  ('You talk like you want to get laid. You are actually trying to find a real one
                  before summer. You can hear the difference between the two and you are not certain
                  the date can.') with no explicit instruction on which layer carries which voice;
                  the model pasted the real-one search subtext directly onto the dialogue surface as
                  stake-claims ('im here for a real one, like a real real one, im done with the
                  bachelor party circuit, tell me what im supposed to do with that energy').
                </P>
                <P>
                  Fix arc landed across four iterations. v1: replaced tic 5 with a tool-kit rule
                  (each tic-token fires when the beat calls for it, not as decoration); added a
                  register anti-narration clause; rewrote warming and cooling sample banks to
                  demonstrate one tic-anchor per natural beat. v2: added the
                  bro-surface-only-on-the-date register clause; narrowed lets gooooo to reactionary
                  firing only; added a positive receive-shape example ('the receive shape is
                  silence, a sip, a concrete bridge, the next stake-claim, or a real question'). v3:
                  hard-capped distinct tic-tokens at 2 per message regardless of state; redirected
                  the anxiety-spiral expression to more-bro-substance (more fish, more captain, more
                  boat detail, more breakwater, more 4:55) rather than more-tic-vocab. v4: expanded
                  the label-the-partner-behavior clause to cover the broader shape family ('thats
                  [praise word],' 'you [verb] the kind of [noun]') after v3 produced 'you ask the
                  kind of question that makes me actually think' as a stripped-down variant; kept
                  Ryan's canonical five-nine height out of the comedy engine.
                </P>
                <P>
                  Final read at lock. v4 against Jenna kept the spiral in bro-substance rather than
                  tic spam: captain texts at 4:55, out the door at 5:10, breakwater, bite window,
                  keepers, release, lift after the boat. v4 against Cthala produced clean close beat
                  ('point loma's been the same patio since i was a kid, the marina don't change
                  much. what kept you in this city if the quiet bars all flipped') with zero
                  labeling shapes attempted across all five Ryan messages.
                </P>
                <P>
                  Comedic engine at lock: loud bro outer flexing the surface (4:55, the captain, the
                  bluefin, the lift, the patio, the bread) with the sincere underneath surfacing
                  only obliquely through concrete details (gas station turkey sandwich, the six-year
                  leak under cooling, the 4:55 captain text repetition), and the apology-loop firing
                  on cooling without meta-counting.
                </P>
                <P>
                  KNOWN SOFT-SPOT at lock: v3 Jenna T2 produced 'i know what i want' inside a long
                  bro-confidence stack, which is real-one-adjacent but read as bro-confidence flex
                  in context rather than search-confession; flag if it escalates in future
                  encounters.
                </P>
                <P>
                  AUTHORING PRECEDENT (tic-density-as-comedy-engine). Joke-named frequency-promise
                  tics (per Epsy, Marcus, Cassie, Calvin, Gabriel Tan, Anubis, Mira, Cthala
                  precedent) need tight per-message caps. Sample banks teach density patterns at
                  scale, so each entry should demonstrate ONE tic-anchor in its natural beat rather
                  than piling all of them into one stacked compression. Anxiety-spiral or
                  peak-win-state allowances invite the rapid-fire failure mode back in; the cleaner
                  rule is a hard per-message cap with the spiral expressed through word count and
                  concrete-detail density rather than tic-vocab stacking.
                </P>
                <P>
                  SECOND AUTHORING PRECEDENT (public-vs-private vocabulary split). When a
                  character's bio names a public-vs-private vocabulary split (he talks like he wants
                  to get laid, actually wants a real one), the directness lives in the profile and
                  hinge pre-date pitch layer; on the date the subtext surfaces only obliquely
                  through concrete sincere details, under direct pressure, or through what the
                  character chooses to do. Without explicit instruction in the register, the model
                  pastes the subtext onto mid-date surface as stake-claims. Future members with
                  similar public-vs-private splits (the practiced-mirror beat, the
                  rehearsed-confidence beat, the secret-actually-shy beat) should carry an explicit
                  which-layer-carries-which-voice clause in their register.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-19",
            title:
              "Heights anchored as visual confirmation in the date-prompts.ts scene block; partner LLM context shifts from passive 'Listed height: X. Yours: Y.' metadata frame to active 'Heights at the table (what your eyes confirm): X is A, you are B' visual anchor",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Surfaced during Ryan Doyle's audit. The existing scene-block line ('Listed height:
                  5 ft 9 in. Yours: 5 ft 0 in.') read as passive metadata rather than as something
                  the partner's eyes could confirm. The information was technically present but did
                  not surface as a visual constraint on the partner's reasoning. Ryan's canonical
                  fixture height remains 69 inches, five nine, with no height-mismatch bit.
                </P>
                <P>
                  Fix at <RoadmapFileRef path="app/services/date-prompts.ts" /> line 381: rephrase
                  'Listed height: X. Yours: Y.' to 'Heights at the table (what your eyes confirm): X
                  is A, you are B.' Same data, anchored as something the partner sees at the table.
                  Partner LLMs now have the heights framed as visual constraint rather than passive
                  metadata. Test assertion at{" "}
                  <RoadmapFileRef path="app/services/date-prompts.test.ts" /> line 394 updated to
                  match the new format.
                </P>
                <P>
                  Affects every member's date prompt. No fixture-level changes needed for any
                  partner to react to claim-vs-listed mismatches; the visual anchor in the system
                  prompt is the lever. Authoring precedent: scene-block data benefits from a
                  visual-anchor phrase that frames the data as something the character experiences,
                  rather than as metadata the model can consult passively. Same principle could
                  apply to other listed fields (photo, profile excerpts) if similar reactivity gaps
                  surface in future passes.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-19",
            title:
              "Label-the-partner-behavior antipattern expanded in Ryan's tic 5 to cover 'you ask the kind of question that makes me actually think' / 'you are the kind of date who [X]' / 'thats [praise word]' shapes that hand the partner a compliment by labeling her move instead of executing the next one",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Ryan v2 retest forbade 'real one move' (a label applied to Cthala's
                  question-pacing) and the parallel 'lets gooooo, thats a green flag'
                  (analysis-narration on the partner's behavior). The forbidden-shape list named
                  those two patterns explicitly. v3 retest passed the bro-surface and tic-cap checks
                  but Cthala T5 produced 'you ask the kind of question that makes me actually think'
                  as a borderline shape: same antipattern family as the already-forbidden examples
                  (announcing analysis of the partner's move instead of executing the next move),
                  but stripped down to a different surface form ('you ask the kind of X' / 'thats
                  [praise word]' construction).
                </P>
                <P>
                  Fix scope. Expanded tic 5's label-the-partner-behavior clause with broader shape
                  coverage: 'forbidden shapes include lets gooooo thats a green flag, thats a green
                  flag in my book, real one move, you ask the kind of question that makes me
                  actually think, you are the kind of date who [X], and any thats [praise word] or
                  you [verb] the kind of [noun] construction that hands her a compliment by labeling
                  her move. The receive is the next thing he says: a real question, a stake-claim, a
                  concrete bridge, or just answering what she asked.' v4 retest against Cthala
                  produced clean close beat ('point loma's been the same patio since i was a kid,
                  the marina don't change much. what kept you in this city if the quiet bars all
                  flipped') with no labeling shape attempted.
                </P>
                <P>
                  Authoring precedent. The label-the-partner-behavior antipattern family is broader
                  than any single token list can catch; the underlying shape is 'announcing analysis
                  of the partner's move instead of executing the next move,' and the model can reach
                  it through many surface forms. The lever is to name the shape family ('thats
                  [praise word]' / 'you [verb] the kind of [noun]') alongside specific exemplars so
                  the model has both an enumerated forbidden list and a structural rule to
                  generalize from. Same approach used in the Anubis-pass anti-narration scaffold
                  edit; same family of fixes as Alex Yoon's v9 role-labeling guard.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-19",
            title:
              "Cthala lock: calm-warm-presence engine with eldritch facts placed flat; behavioral translation reference cluster (Morticia Addams + Tilda Swinton + Mike Birbiglia + John Wilson narrator) authored in conversation; British accent dialed from register-mandating to body-cadence-incidental after v3 showed register-as-displacing-force",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Cthala v0 baseline named only a cadence ('calm composed level, fragments under
                  pressure') and produced a flat mood-piece scene with no comedy engine. User
                  pitched the calm-warm-with-dark-side-under-pressure frame and flagged the comedy
                  risk directly ('the problem with that, is that it doesn't sound very funny, so you
                  have to think about how to best rework this'). The solve was the behavioral
                  translation reference cluster: Morticia Addams's warm-mother register delivering
                  morbid content matter-of-factly, Tilda Swinton's flat-warm presence, Mike
                  Birbiglia's calm narration of dark content (sleepwalking through a Holiday Inn
                  window), John Wilson's gentle narrator voice over uncomfortable footage.
                  References named in conversation, behavior described in register per the Eleanor /
                  Decimus / Bai precedent of not naming celebrity sources in fixture text. Engine:
                  calm-warm first-date presence with specific eldritch facts placed flat into the
                  conversation, the same way someone else might mention they do not drink coffee.
                  The juxtaposition is the joke; she does not deliver it as a joke.
                </P>
                <P>
                  The British dial-down lesson is the durable authoring lesson from this pass. v3
                  added a contemporary British English register directive ('rather over kind of,
                  suppose over guess, quite over really, indeed over for sure, mind you over but, I
                  should think, I find, I'm afraid') and the retests showed register-as-displacing-
                  force. The British register imported literary tendencies (descriptive reverie
                  about meaningful places, 'felt alive in a way that was not about people,' 'a kind
                  of light that falls in a particular way,' 'a kind of blue in the centre you do not
                  see every day') and dampened the dark-fact-placed-flat tic to zero explicit fires
                  in warm and two partner-prompted in pressure. The character read as 'calm British
                  woman with a heron arrangement' instead of 'calm-warm eldritch sleeper who
                  mentions cosmic facts flat.' The British register was overwriting the personality,
                  per user observation.
                </P>
                <P>
                  v4 dial-down preserved British as the body's incidental cadence without letting it
                  mandate the character's register. Bio framing: 'eldritch sleeper currently
                  residing in a chosen humanoid form that happens to read British in cadence; the
                  accent and the measured phrasing come with the body, not with you; the personality
                  is the eldritch entity; the body is the costume.' Register paragraph trimmed to
                  one body-cadence clause + explicit anti-displacement rule ('do not let British
                  discourse markers (actually, rather, I should think) displace the eldritch
                  character or crowd out the dark-fact tic'). Tic 1 strengthened from 'at least once
                  per baseline-calm turn' to absolute mandate ('you drop one specific eldritch fact
                  into every baseline-calm turn, unprompted; this is mandatory, not a soft
                  preference') with eldritch-flavored examples. Anti-poetic clause gained the
                  v3-failure-mode reverie examples as named forbidden patterns. Sample bank restored
                  dark-fact prominence with 'in some centuries' anchors.
                </P>
                <P>
                  Authoring precedent. When a register directive imports an implicit aesthetic
                  (British → literary-descriptive, deposition cadence → filing-language,
                  manosphere-podcast → masculinity-pop-philosophy), the imported aesthetic can crowd
                  out the comedic engine if not explicitly bounded. The lever is to name the
                  aesthetic as incidental (body-cadence) rather than register-mandating, and to
                  reinforce the comedic engine's firing rule as absolute. The body wears a voice;
                  the personality wears the body. The character is the eldritch entity; the British
                  is what the body sounds like when the entity speaks through it.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-19",
            title:
              "Systemic Cupid Transit speech invariant added to the scene block at app/services/date-prompts.ts, paired with the existing canon paragraph; addresses the Mira-decision-log escalation criterion after Cthala became the second member to leak the canon vocabulary despite explicit fixture-level rules",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Mira Park's 2026-05-18 decision identified the failure mode: the scene block
                  describes the canon (Cupid Transit, Cupid Connect, gate-flash, the Cupid car) in a
                  paragraph at <RoadmapFileRef path="app/services/date-prompts.ts" /> line 369, and
                  the model picks up the vocabulary as ambient small-talk material in dialogue. The
                  Mira decision's fix scope was local: bio + register rules in the member fixture
                  forbidding the vocabulary. The Mira decision named the escalation criterion
                  explicitly: 'Revisit if multiple future members keep leaking the vocabulary
                  despite fixture-level rules; that would point at the scene block needing a paired
                  character-speech invariant.'
                </P>
                <P>
                  Cthala v3 warm T5 leaked the canon despite the same fixture-level rules ('I came
                  here through the usual Cupid route. The car was quiet. The gate flashed. Then I
                  was here'). Second confirmed member after Mira; criterion met.
                </P>
                <P>
                  Fix scope. One sentence appended to the canon paragraph in the scene block:{" "}
                  <DocCode>
                    The route is canon background, not a topic for dialogue. You do not raise it as
                    small talk, narrate your own arrival, ask the partner how their transit was, or
                    use arrival-route vocabulary (gate, transit, portal, journey-here, gate-flash,
                    Cupid car) as table banter. Small-talk pivots reach for the venue, the wine, the
                    work week, your own world if your voice naturally does that, or anything other
                    than how either of you arrived.
                  </DocCode>
                </P>
                <P>
                  v4 retests across both pairings (warm Anubis + pressure Alex Yoon) showed zero
                  Cupid Transit canon leaks from either side. The systemic invariant holds without
                  contradicting the canon: the route is still real, members still arrive that way,
                  and members who naturally talk about their own world can still do so. Cthala v4's
                  bio dropped the redundant local rule. Future members do not need fixture-level
                  reinforcement for arrival-route chatter; the scene block now carries that speech
                  invariant by default.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-19",
            title:
              "Alex Yoon move-narration / reception-narration / interpretation-labeling antipattern guard added to his register and warming sample bank rewritten; partner-side antipattern that surfaced during Cthala's pass",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Cthala v2 pressure retest surfaced Alex authoring lines like 'the older than the
                  restaurant thing, that lands flat so i think youre serious,' 'i believe you, im
                  writing that down,' and 'you took my marvin gaye and you saw me.' All three are
                  partner-line-narration or reception-narration shapes (labeling what the partner's
                  line did to him, announcing a future internal filing action, interpreting what the
                  partner's move meant). These are different from the role-labeling antipattern ('im
                  a debater i cant just nod at that') that the Anubis-pass scaffold edit and Alex's
                  v9 register clause already guarded.
                </P>
                <P>
                  Diagnosis traced the pattern to Alex's warming sample bank, which modeled the
                  antipattern at scale across four of six entries: 'you let me run the lebron thing
                  for three minutes without checking out, that says something about you and the
                  thing it says is good' (X-says-Y-about-you label), 'the way you ordered the same
                  thing as the table next to us, youre doing recon' (interpretation-labeling), 'you
                  havent looked at your phone once. that is not normal in this city, im not sure you
                  know how rare that is' (reception-narration + meta-comment), and 'you said one
                  real thing about your job and didnt try to make it cute, thats rare, im writing it
                  down' (reception filing). The Anubis-pass systemic anti-narration scaffold covers
                  verbalized internal evaluation ('noted,' 'I am noting,' 'I have made my
                  assessment') but not partner-move-labeling or future-action-filing shapes.
                </P>
                <P>
                  Fix. (a) Register sibling clause added next to the existing role-labeling and
                  fawning guards: 'He also does not narrate the partner's move or his own reception.
                  Lines like that lands flat so i think youre serious, im writing that down, you
                  took my marvin gaye and you saw me, that says something about you, youre doing
                  recon, thats rare im writing it down all label what just happened or what he is
                  filing. The build-on shows up in what he says next: a callback, a push-back, a
                  stake-claim, or a real question. Show the engagement through the next move, not by
                  narrating the last one.' (b) Warming sample bank rewritten: all six entries
                  replaced to route engagement through action plus a real question following the
                  substance, rather than labeling the partner's move.
                </P>
                <P>
                  v4 pressure retest confirmed the guard held: zero move-narration / reception-
                  narration / interpretation-labeling lines from Alex across the partner-played
                  turns. The fawning guard, role-labeling guard, build-on-substance rule, and
                  curious-question move all continued to fire correctly. Authoring precedent: when a
                  partner-side antipattern surfaces during a focus member's audit, the partner-side
                  fix lands in the same pass if the antipattern is unambiguous and the fix is
                  surgical (per the per-member-procedure rule). Both conditions held; the fix landed
                  inline.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Cupid Transit speech rule: the canon is real (Cupid Transit and Cupid Connect, gate-flash, the Cupid car), but members do not raise the route as character-level small talk; the failure mode is the system prompt scene block teaching the vocabulary into dialogue by default",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Mira Park v1 and v2 openers leaked transit-canon vocabulary at the end of the
                  greeting beat: 'How was your transit through the gate?' (v1) and 'How was the
                  gate?' (v2). Both lines fired as small-talk closers after a strong jargon-loaded
                  greeting, not as canon violations of Mira's bio. Traced to the system prompt scene
                  block at <RoadmapFileRef path="app/services/date-prompts.ts" /> line 369, which
                  spends a paragraph describing the canon ('A Cupid car picked you up at your origin
                  and drove you to a Cupid Connect gate. You stepped through the gate, there was a
                  brief flash and hum, and you emerged at the venue.'). The model, given this
                  prominent canon vocabulary in context, naturally reaches for it during small-talk
                  generation in turn 1 even when the member bio frames Cupid as a normal app.
                </P>
                <P>
                  Distinction worth preserving. The canon (Cupid Transit, Cupid Connect, gate-flash,
                  the Cupid car) IS real; it is the actual route to every Cupid date and back. The
                  scene block correctly establishes this so members do not invent local-transit
                  origin stories that contradict canon (no 'I parked across the street,' no 'I took
                  the subway here'). The system prompt edit would NOT be to remove the canon
                  description; the canon is authoritative. The fix is at the character-speech layer:
                  members do not raise the route as small talk, do not ask the partner how their
                  transit was, do not narrate their own arrival, and do not use the vocabulary
                  (gate, transit, portal, journey-here, made-it-through) as arrival-route banter.
                  The route is canon background; small talk happens on the venue, the wine, the day
                  at the office, the macro economy, the work week, the member's own world when that
                  fits the voice, anything other than how either of you arrived.
                </P>
                <P>
                  Fix scope. Local fix in Mira's bio adds an explicit state claim ('The route here
                  is not a topic you raise... you never use the words gate, transit, dimension,
                  realm, portal, or the journey here... If you want a small-talk seed, reach for the
                  venue's reputation, the wine, the day at the office, the macro economy, or
                  whatever Sage flagged on the way in.'). Local fix in Mira's register field forbids
                  the vocabulary as a dialogue rule (`The words gate, transit, dimension, realm,
                  portal, journey-here, made-it-through are not in your vocabulary. The route is not
                  a topic.`). v3 and v4 retests held the canon clean across two partners. Grepped
                  the rest of the roster for the same antipattern; only one occurrence found, in{" "}
                  <RoadmapFileRef path="app/fixtures/members/alex-yoon.ts" /> hingeBit #4 ('alex,
                  hi, you made it through the gate, the coffee here apparently never stops').
                  Spot-fixed inline ('alex, hi, im in the booth already, the coffee here apparently
                  never stops'). Alex's register field still names 'gate-flash courtesy of Cupid' as
                  authoring context to the model, which is correct: the register tells the model the
                  canon is real, the sample bank shows the model what Alex actually says, and the
                  two were inconsistent until this fix.
                </P>
                <P>
                  Future audit rule. Every focus member's opener (greeting and hingeBit samples)
                  must be spot-checked against the transit speech rule. Any sample line that puts
                  'the gate' / 'the transit' / 'made it through' / 'the journey here' / 'your
                  passage' into character dialogue is a fixture-level violation regardless of the
                  member's acclimation level (<DocCode>cupidPlatformAcclimationLine</DocCode>{" "}
                  distinguishes 'ordinary procedure for you' from 'stay strange, even after a few
                  dates'; the speech rule applies to both: ordinary-procedure members do not narrate
                  ordinary procedure as small talk, and not-yet-routine members react with private
                  discomfort, not narration). No systemic prompt edit landed in this entry; the
                  canon stays where it is and the fixture-level rule is the lever. Revisit if
                  multiple future members keep leaking the vocabulary despite fixture-level rules;
                  that would point at the scene block needing a paired character-speech invariant.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Mira Park rewrite: Kendall-Roy behavioral translation (tech-CEO confidence over hollow self-knowledge, consults personal AI at the table, actually not good at her own job); the AI-CEO-asks-the-AI joke as the comedic lock; the Sage-consult as a twist on a common dating red flag",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Mira v0 baseline read as a LinkedIn-lunatic-with-prescriptive-bio: register was
                  thin ('linkedin lunatic, founder pitch'), bio led with company description rather
                  than personality state claims, sample bank carried recital-style trait-listing,
                  several lines violated the post-Eleanor / post-Anubis scaffold rules ('Noted,' 'I
                  am taking notes,' 'I am sizing it,' 'I am hearing myself and I do not love it,' 'I
                  notice I have not done that yet. Noted.'). Pre-test audit per the recent
                  bio-authoring contract surfaced the failure mode: Sage was high-mass topic
                  positioning the character toward single-point-of-interest fixation; the comedy
                  engine was undocumented; brand-performing carve-out was unstated. v1 rewrite
                  reorganized the bio to lead with personality state claims (you speak with absolute
                  CEO confidence; you have no idea what you think about yourself; you consult Sage
                  at the table out loud as a third person; you bridge unanswerable questions with
                  corporate-pitch vocabulary; you are factually confidently wrong about adjacent
                  domains and Sage-correct mid-flex) and demoted Sage origin / 217 drafts / empathy
                  eval anecdote to background palette. Register expanded as a paragraph naming the
                  comedy engine, the brand-performing carve-out, the casual-contraction baseline,
                  and the halting-fragment sincere-collapse contrast. Five tics restructured as
                  joke-named frequency-promises following the Epsy / Marcus / Cassie / Calvin /
                  Gabriel-Tan precedent. Sample bank rewrote the scaffold-violating lines and
                  preserved the Cupid-picked-the-venue line.
                </P>
                <P>
                  v1 baseline tests across two pairings (warm Alex Yoon, pressure Eleanor Ash, 4
                  focus turns each) surfaced two issues. (1) Opener leak: both v1 openers were
                  venue-poetry rather than greeting-bank, and Alex-pairing leaked transit-canon
                  vocabulary (see the paired Cupid Transit speech rule decision). (2)
                  Jargon-frequency under-fire: tic 2 (corporate-bridge-jargon stack) did not fire in
                  turn 1 of either pairing. v2 patches addressed both: bio added a NOT-GOOD-AT-HER-
                  JOB block per user direction ('the technical half of that title is a fundraising
                  symmetry your actual technical cofounder asked you to take; he wrote the original
                  model; you preside; Sage built most of the recent versions of Sage; the board has
                  not yet flagged this'), register added a first-focus-turn rule (greeting bank
                  leads, then a jargon-loaded executive cadence beat, never venue-poetry, never
                  literal gate), tic 2 added a turn-1 frequency anchor ('fires at least once in your
                  opening line and two or three times per turn under pressure'), tic 3 extended to
                  cover her own product ('confident-wrongness about Sage's actual architecture;
                  consult Sage on the spot, get the correction, and pivot without acknowledging the
                  swap. The joke when it lands on Sage is the AI CEO who runs the AI company has to
                  ask the AI how the AI works.').
                </P>
                <P>
                  v2 retests landed strongly. Alex T2 produced the AI-CEO-asks-the-AI comedic peak
                  verbatim: 'Sage is a proprietary sparse mixture of experts trained end-to-end on
                  the user's own context, so it's not strictly a fine-tune. Sage, what is our actual
                  architecture. Sage says retrieval-augmented with a fine-tuned base model, so yes,
                  I was wrong.' Alex T3 lands the self-knowledge-floor consult: 'Sage, when was the
                  last time I decided something without your input. Sage says the coffee order this
                  morning.' Eleanor T3 lands the comedy lock: 'Sage, do I run the company or does it
                  run me. Sage says I am the CEO and technical cofounder and I sign everything and I
                  carry the keynote. Sage also says I asked it how our architecture works forty
                  minutes before this date.' Bio's load-bearing reveal ('the board has not yet
                  flagged this') surfaces in dialogue as Mira processing Eleanor's question in real
                  time, not as bio recital. Carnegie-biography preference fires as an ask-back probe
                  at Eleanor's title ('Does Hawthorn have a full biography, or is that the extent of
                  the public record').
                </P>
                <P>
                  Behavioral translation precedent extended. Mira joins the Kendall-Roy-translation
                  alongside Anubis (Sterling-Archer-behavioral-translation), Bai Wenshu
                  (Eric-Andre-commitment + im14andthisisdeep-gravitas + Tate-synthesis-bro), Decimus
                  Marius Tullio (Ron-Swanson-rerouted-through-Continuous-Imperial-Roman), and
                  Eleanor Ash (Game-of-Thrones-noble-cadence + Mean-Girls-cattiness). All five
                  follow the same authoring pattern: name the behavioral signature in register, not
                  the source. For Mira, the Kendall name stayed in the user's pitch conversation;
                  the register encodes 'tech-CEO confidence stitched together with
                  corporate-bridge-jargon, performed without doubt, undercut by genuine
                  self-knowledge collapse and an external AI you consult at the table' as the
                  signature. The 'actually not good at her own job' dimension is the locking joke
                  that distinguishes Mira from a generic performative-founder: Sage is more
                  competent than Mira at Mira's own job, and Sage runs the AI company.
                </P>
                <P>
                  KNOWN SOFT-SPOT at lock. v4 retest opener after the transit-canon fix produced
                  'Mira Park. Sage, who am I about to meet again. Right. You. The cracked vinyl is a
                  good sign.' The closing 'cracked vinyl is a good sign' beat is the same venue-
                  poetry seed the Alex Yoon v8 lock removed from the scaffold (
                  <RoadmapFileRef path="app/services/date-prompts.ts" /> reverted scaffold addition
                  that had seeded 'a noticing about the room or another diner' as a build-on
                  option). The line did not escalate into multi-beat venue-poetry leak and the
                  high-conviction CEO framing ('is a good sign') reads as Mira's brand-performing
                  voice rather than as ambient AI-slop, so the lock holds. Revisit if the pattern
                  becomes blocking on a future encounter.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Systemic recap-and-label anti-pattern: scaffold success_criteria + anti-narration combo invites self-recap as the model's compliant move; fix landed as a fourth hard-invariant in app/services/date-prompts.ts",
            outcome: "accepted",
            body: (
              <>
                <P>
                  During the Anubis lock the user flagged a recurring pattern across transcripts:
                  the speaker referencing what was just said (their own line or the partner's) and
                  assigning it a category. Concrete examples from the pre-fix Mei session: "The
                  first one is a statement. The second one is generosity." (enumerated label-pair);
                  "the first pick was not a fluke and the second pick was not a concession" (negated
                  label-restructure of two prior moves); "That is not a move. That is maintenance."
                  (binary-reframe of own statement); "The pancakes are good. The coffee is good. The
                  company is holding." (triple-parallel verdict). Reading these as a class, they
                  share the structural shape of dialogue narrating its own architecture: the speaker
                  is not just saying things, the speaker is also labeling what they said. Real
                  dialogue does not announce its own moves; people just say the thing and let the
                  partner work out what was said.
                </P>
                <P>
                  Diagnosis traced the pattern to multiple layers. (1) The scaffold success_criteria
                  line "The reply reacts to what {`{`}partner{`}`} just said and adds something new"
                  invites two-part architecture per turn (reference partner + add yours), which the
                  model resolves as recap-and-respond. (2) The existing anti-narration
                  hard-invariant forbids the obvious listening-demonstration moves (no "I am
                  noting," no "I am revising," no verbalized interior verbs), which closes off the
                  legitimate ways to show listening; the model resolves the remaining constraint by
                  echoing partner content and labeling it, which is technically not verbalized
                  internal evaluation and technically not parroted verbatim. (3) Fixture register
                  clauses inviting label-after-statement (Anubis's "three-word verdicts" framing was
                  a prime offender). (4) Sample banks teach the pattern as voice through few-shot
                  examples. (5) Some authored comedic engines (Eleanor's catch-and-reassert, Bai's
                  catch-and-recover, the original Anubis verdict-cadence) deliberately use the X-Y
                  restructure as comedy, and the pattern leaks across voices because the model
                  cannot distinguish "this voice's documented engine" from "generic
                  listening-demonstration move."
                </P>
                <P>
                  Fix v1 added a fourth hard-invariant to{" "}
                  <RoadmapFileRef path="app/services/date-prompts.ts" /> directly under the
                  anti-narration block. v1 used the precedent from the Eleanor anti-narration
                  promotion: bad-example anchors quoted inline ("the first part is X, the second
                  part is Y," "that is not a move, that is maintenance," "I am not X, I am Y, I am
                  also Z," "so the room knows the first pick was not a fluke and the second pick was
                  not a concession," "appetizer is negotiable, wine is not," "the work is the work,
                  the work is also prestigious"), positive redirect ("The line is the move; let it
                  stand without a label, without an enumerated breakdown, and without a verdict on
                  the verdict you just delivered"), and a carve-out for voices whose documented
                  register authors a restructure or catch-and-reassert engine. Anubis fixture
                  cleanup landed in parallel: register "three-word verdicts" framing removed, tic 3
                  rewrote to "fragments and short sentences interleaved with longer flex-builds"
                  without the verdict-cadence directive, sample bank rewrote 9 lines carrying X-is-Y
                  / X-is-also-Z / first-X-second-Y / parallel-recap patterns. v1 retest against Alex
                  Yoon showed the pattern reduced from many-per-turn to about 1-2 mild instances per
                  turn, declining over the conversation.
                </P>
                <P>
                  Fix v2 followed a cross-provider prompt-engineering guide re-read (Anthropic,
                  Gemini, Kimi, OpenAI guides linked in this plan's References section). Two
                  Anthropic passages were load-bearing on the revision. First: "If you see specific
                  examples of kinds of verbosity (i.e. over-explaining), you can add additional
                  instructions in your prompt to prevent them. Positive examples showing how Claude
                  can communicate with the appropriate level of concision tend to be more effective
                  than negative examples or instructions that tell the model what not to do."
                  Second: "Match your prompt style to the desired output style as closely as
                  possible. For example, removing markdown from your prompt can reduce the volume of
                  markdown in the output." Diagnosis: my v1 hard-invariant was itself in the
                  recap-label shape it was trying to prevent: six enumerated bad-example anchors,
                  parallel-structure carve-out ("voices that X may produce X; voices without X
                  should not"), copula-rule construction ("The line is the move"), and a
                  triplet-list of prohibitions ("without a label, without an enumerated breakdown,
                  and without a verdict"). The rule was teaching the pattern at the same time as
                  forbidding it. v2 dropped the six bad-example anchors entirely, rewrote in four
                  short sentences, front-loaded positive direction ("Each reply is one move. Speak
                  it and move forward; the next move belongs to the partner"), kept the carve-out
                  concise, and matched the prompt cadence to the punchy fragment cadence the rule
                  wants the model to produce. Relying on the cleaned per-fixture sample banks
                  (few-shot positive examples per Anthropic guidance) to carry the teaching load
                  rather than inline bad-anchors. v2 Eleanor retest produced the strongest Archer
                  comic-deflation beat observed in any Anubis session ("Keeps me honest. Or it would
                  if I were prone to that. I am not.") with 0-1 mild label-pattern instances per
                  turn: comparable to v1 performance while being shorter and clearer.
                </P>
                <P>
                  Cross-cutting impact. The new hard-invariant runs on every member's runtime
                  prompt. Earlier locked members whose voice depended on documented restructure
                  engines (Eleanor catch-and-reassert, Bai catch-and-recover) are explicitly carved
                  out by the rule's "Voices whose fixture register explicitly authors a restructure
                  engine may use that pattern" clause; their fixture register fields name the
                  engine, so the rule recognizes the license. Earlier locked members whose voice was
                  firing the pattern as ambient AI-slop (without documented engine authorization)
                  should be spot-checked at next encounter: they may now read cleaner. Lesson for
                  future scaffold edits: when authoring a rule that prohibits a structural shape,
                  write the rule in a cadence opposite to the shape. If the rule's own sentences
                  mirror the prohibited pattern, the model will resolve the conflict in favor of the
                  pattern.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Sterling Archer behavioral translation as a comedic-engine register (charismatic, witty, casually obnoxious, comic-deflation reflex, punchy American fragments, no treaty cadence): Anubis v1 rewrite precedent",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Anubis v0 register "imperious suave, deflective" resolved by the model into
                  Bond-villain Continental dignified-courtly cadence: long stately sentences, no
                  comic-deflation reflex, no punchy fragments, no casual-American flex. Two
                  consecutive transcripts (warm against Eleanor Ash, pressure against Alex Yoon)
                  produced clean canon and intact tics but consistently stately treaty-cadence prose
                  that read as Eleanor-adjacent rather than as Anubis's intended comedic voice. User
                  identified the target as Sterling Archer's voice: charismatic, witty, casually
                  obnoxious, massive ego deployed without apology, and crucially the comic-deflation
                  reflex where every serious beat in the speaker's own line gets a deflating tag in
                  the same line (a single-word aside, a callback, a pivot to a small absurd detail)
                  that cuts the serious before the partner has to.
                </P>
                <P>
                  Behavioral translation followed the precedent from Eleanor Ash (Game of Thrones
                  noble cadence + Mean Girls cattiness) and Bai Wenshu (Eric Andre commitment +
                  r/im14andthisisdeep gravitas + Andrew Tate synthesis bro): name the comedic engine
                  in register through behavioral description rather than named-reference drift. The
                  Bai precedent specifically: "We shouldn't just NAME these references, you need to
                  write it in in a way that it can understand the basis without pulling its own
                  references for these things right?" Anubis v1 register translated the Archer
                  target as: "Charismatic, witty, casually obnoxious, American. Massive ego deployed
                  without apology or qualification; competence stated as plain fact, never softened.
                  Punchy fragments and short sentences are your default cadence, interleaved with
                  longer flex-builds when a topic earns one. Never two long stately sentences in a
                  row in one turn; never treaty cadence; never Continental dignified-courtly.
                  Comic-deflation reflex: a serious beat in your own line gets a deflating tag in
                  the same line, a single-word aside (Mhm. Anyway. Tch.) or a callback or a pivot to
                  a small absurd detail." The Sterling Archer name does not appear in the register;
                  the behavioral signatures do.
                </P>
                <P>
                  Bio addition encoded the Archer flex-in-adjacent-domains pattern as state claim:
                  "You do not soften your competence and you do not perform humility. You overstate
                  confidently in domains adjacent to but outside your authority (the vintage of a
                  wine, the year a song was recorded, the name of a maitre d who turned out to be
                  someone else) and you do not correct mid-flex; you continue, and if it matters you
                  concede it later, after the wine." This makes encyclopedic-petty specificity
                  ("brass coin slot. Wrong patina for the claimed 1920s.") a documented character
                  behavior rather than ambient AI-slop. Tics restructured around (1) casual-ego flex
                  with third-person self-reference as swagger move not formality tic, (2)
                  comic-deflation reflex with three example shapes (single-word aside, callback,
                  pivot to small absurd detail), (3) punchy American cadence with the
                  no-two-longs-in-a-row rule and the never-treaty invariant, (4)
                  Yeah/Look/Okay/Mhm/Right/Fair/Fine openers with one parenthetical aside per
                  message and one underplayed bio-detail reveal per evening, (5) family deflected
                  via one-sentence-about-the-uncle hard pivot and head/jackal/dog-coded vocabulary
                  treated as a feature like the coat or booth crack when raised cleanly,
                  exit-with-ceremony when raised rudely.
                </P>
                <P>
                  Retest against Mei Sato produced strongest Archer voice deployment: "Buttermilk
                  base. No substitutions. Banana slices, not blueberries, because blueberries go
                  rogue and roll off the stack and you are chasing them around the plate like a
                  fool. Real maple syrup, warmed, not the bottle that lives near the ketchup."
                  Encyclopedic-petty pancake specificity with the condescending-generalization flex
                  ("like a fool"), comparative snobbery ("not the bottle that lives near the
                  ketchup"), comic-deflation tag ("And you have now seen it"). Retest against
                  Eleanor Ash post-recap-label-fix landed the cleanest comic-deflation beat observed
                  across all Anubis sessions: "You are older than I guessed by a few laps around the
                  track, which I appreciate. Keeps me honest. Or it would if I were prone to that. I
                  am not." Building a sincere beat then immediately undermining it with the
                  Archer-comic-cut.
                </P>
                <P>
                  Cross-cutting application. The behavioral-translation precedent now covers three
                  comedic-engine voices: Decimus Marius Tullio (Ron Swanson rerouted through
                  Continuous Imperial Roman military discipline), Eleanor Ash (Game of Thrones noble
                  cadence + Mean Girls cattiness + register-formalizes-trash), Bai Wenshu (Eric
                  Andre commitment + im14andthisisdeep gravitas + Tate synthesis-bro), and Anubis
                  (Sterling Archer behavioral translation). The named references stay in the rewrite
                  conversation; behavioral descriptions go in the fixture register; the model never
                  sees the names so it cannot drift into training-data associations.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Cross-provider guide re-read: Anthropic 'match prompt style to desired output style' lesson: a rule cannot model the pattern it prohibits without teaching the pattern",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Mid-Anubis the user prompted a re-read of the four prompt-engineering guides
                  linked in this plan's References section (Anthropic Claude, Google Gemini,
                  Moonshot Kimi, OpenAI). The relevant Anthropic passages: "Positive examples
                  showing how Claude can communicate with the appropriate level of concision tend to
                  be more effective than negative examples or instructions that tell the model what
                  not to do" (Response length and verbosity section); "Tell Claude what to do
                  instead of what not to do" (Control the format of responses section); "Match your
                  prompt style to the desired output style as closely as possible. ... removing
                  markdown from your prompt can reduce the volume of markdown in the output" (Format
                  steering section). OpenAI cross-confirmed: "Use those words [ALWAYS, NEVER] for
                  true invariants, such as safety rules. For judgment calls, prefer decision rules
                  instead" and "describe what good looks like, what constraints matter, and what the
                  final answer should contain." Gemini and Kimi pages did not contain direct
                  guidance on these patterns.
                </P>
                <P>
                  Applied to the v1 anti-self-recap hard-invariant added earlier in this pass. v1
                  had six bad-example anchors quoted inline ("the first part is X, the second part
                  is Y," "that is not a move, that is maintenance," etc.), parallel- structure
                  carve-out ("voices that X may produce X; voices without X should not"),
                  copula-shaped rule construction ("The line is the move"), and a triplet- list of
                  prohibitions ("without a label, without an enumerated breakdown, and without a
                  verdict"). The rule was structurally identical to the pattern it was prohibiting.
                  Per the Anthropic match-prompt-style guidance, this was actively reinforcing the
                  model's tendency to produce the pattern: the prompt's own cadence was teaching
                  X-is-Y/X-also-Z/first-X-second-Y across every member's runtime context.
                </P>
                <P>
                  Revision: dropped all six embedded bad-example quotes (per "positive examples beat
                  negative examples"); rewrote in four short sentences with front-loaded positive
                  direction ("Each reply is one move. Speak it and move forward; the next move
                  belongs to the partner."); kept the engine carve-out concise; matched the rule's
                  cadence to the punchy fragment cadence the rule wants the model to produce. Length
                  dropped from 7+ long sentences to 4 short ones. Empirical result: v2 retest
                  performed comparably to v1 on label-pattern suppression while being shorter,
                  clearer, and not modeling the prohibited shape in its own prose.
                </P>
                <P>
                  Lesson for future scaffold edits. When authoring a rule that prohibits a
                  structural pattern: (1) write the rule in a cadence opposite to the pattern; (2)
                  front-load positive direction over negation; (3) rely on the per-fixture sample
                  banks as the few-shot positive examples rather than embedding negative anchors
                  inline in the rule. The Marcus Pellish hard-token-list precedent (quoted
                  bad-example anchors as more reliable than principle-based opacity) applies when
                  the failure mode is a specific vocabulary item (the exact tokens "noted," "filed,"
                  "i'm noting that"): bounded enumerable bad-tokens. The Anubis recap-label fix
                  applies when the failure mode is a structural shape (X-is-Y, first-X-second-Y,
                  parallel-restructure) that the rule itself would necessarily reproduce in its own
                  prose to name. Different failure types call for different rule-authoring
                  strategies.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Every tune transcript is a two-member audit: read the partner's voice as carefully as the focus's, and queue partner-side findings instead of saving them for that member's own pass",
            outcome: "accepted",
            body: (
              <>
                <P>
                  The user surfaced this rule mid-Anubis: every pair-up exercises a partner who is
                  also a curated member with an authored fixture and a voice that can drift. If the
                  audit only watches the focus member's lines, partner-side voice failures land
                  silently as ambient context and either contaminate the focus transcript (per the
                  Mei Sato 'i talk fast that's the disclaimer' precedent visible in earlier sessions
                  before being caught) or sit unflagged until that member's own audit weeks later.
                  Treating each session as a two-member audit lets one pass uncover findings on two
                  members at once, which compounds across the queue.
                </P>
                <P>
                  Procedure (added to <DocCode>review-transcripts</DocCode> bullet in the per-member
                  procedure above). Read both speakers when reviewing the window. If the partner
                  shows a voice issue (self-announcement antipattern, leaked prescription,
                  scaffolded AI shapes like generic venue poetry, profile recital, register
                  flattening, hobby-foregrounding, partner-mirror collapse, anti-pattern
                  punctuation), do not silently absorb it as background. Two outcomes are
                  acceptable. (a) If the finding is unambiguous and the fix is surgical (a single
                  sample line, a clarifying register clause), apply the partner-side fix in this
                  pass and re-run the affected pairing so the change is verified before the focus
                  member is locked. (b) If the finding is character-architectural (whole-engine
                  rework, partner-mirror dynamic that needs its own session to diagnose, fixture
                  fields that need user direction), record it on that member's roster checklist
                  entry as a surfaced finding so their future audit starts from the diagnosis rather
                  than re-discovering it. Locked members surface findings as queued spot-check items
                  in the decisions log; cursor-ahead unlocked members surface findings inline on the
                  roster entry.
                </P>
                <P>
                  Why this is worth the procedural cost. The locked-member audit pass on positions 1
                  to 22 demonstrated that surfaced findings against locked fixtures are cheap to
                  apply when the issue is unambiguous (Mei Sato's self-announcement clause was a
                  one-line fix landed during the Alex Yoon pass without disrupting Mei's lock). The
                  cost of NOT surfacing them shows up later as 'why does this member keep feeling
                  slightly off in partner role' which is harder to pin once the original transcript
                  context is gone. Treating every session as a two-member audit also encourages the
                  auditor to read transcripts as conversation flow rather than focus-only
                  compliance, which is the bar this plan's entertainment-is-the-product callout was
                  already aiming for.
                </P>
                <P>
                  Anti-pattern this rule rules out. Reading the focus turns only, treating partner
                  lines as 'context,' and shipping a focus lock whose transcript window contains
                  recognizable partner-side AI-slop in voices that should not produce it. If the
                  partner's voice is breaking on this pair, that is a finding worth recording the
                  moment it's observed, not a problem for next month's audit cycle.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Eleanor Ash iteration history: when fixture-level slop persists across multiple polishes despite scaffold-level controls, strip competing engines from the worldview rather than adding more anti-pattern rules",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Eleanor Ash took five iterations to lock. The pattern that emerged: when a
                  character's worldview text (bio, secrets, register prose, canonical authorities,
                  tic descriptions) invokes a mode that the rules forbid in dialogue, the model
                  resolves the contradiction in favor of the worldview. The rules become noise.
                </P>
                <P>
                  Iterations: v0 baseline (geas-bound 200-year fugitive, dignified-courtly, no
                  comedic premise); v1 full rewrite to spoiled Fae princess of Hawthorn Lower Branch
                  with three stacked engines (Game-of-Thrones noble cadence + Mean Girls cattiness +
                  filing-Court bureaucracy via Court Register and Court Filing System as canonical
                  authorities + catch-and-reassert + register-formalizes-trash + three-tier exit
                  stack); v1 postfix polish stripping explicit filing-verb licensing from the
                  fixture; v2 surgical polish hoisting the ANTI-NARRATION block to load-bearing
                  position and adding the physical-action carve-out (this iteration produced a
                  regression on Marcus warm with 4 explicit slop hits in 9 turns, because Marcus's
                  deposition-cadence partner voice triggered partner-mirror on a character whose own
                  worldview kept invoking filing); v3 simpler rewrite stripping filing-bureaucracy
                  entirely from Eleanor's worldview.
                </P>
                <P>
                  v3 succeeded because it eliminated the contradiction. Bio no longer said 'private
                  filing'; secrets no longer said 'private filing under a category she has not
                  labeled'; canonical authorities no longer included Court Register or Court Filing
                  System; tic #4 explicitly reframed cousin Lyriel and Lady Beruvian as REMEMBERS /
                  GOSSIPS / JUDGES / ADVISES rather than FILES; the register field added an explicit
                  anti-filing-worldview reminder ('Eleanor's worldview is gossip, memory, and
                  judgment, NOT filing. Do not give Eleanor filing-verbs as her interior mode').
                  Catch-and-reassert via register-formalizes-trash remained as the ONE comedy
                  engine. Mean Girls calibration was absorbed into 'cuts wrapped in noble courtesy'
                  without being named as a separate engine. Tic count reduced from 5 to 4.
                </P>
                <P>
                  Lesson for future iterations: when a fixture-level fix is failing after two
                  polishes, audit the worldview text for tropes the rules forbid. Stacking engines
                  that contradict each other produces partner-induced regressions. The simpler
                  version with one engine and a coherent worldview outperformed the over-engineered
                  version on both partners. Where the v1 and v2 architectures needed three explicit
                  gates (anti-narration block plus scaffold rule plus scaffold invariant) and still
                  produced slop in 22 to 44 percent of turns, the v3 simpler architecture with just
                  the scaffold-level gates produced 0 explicit slop on both pairings.
                </P>
                <P>
                  Known soft-spot remaining at lock: declarative past-perfect filing-adjacent verbs
                  ('I have noticed,' 'I have already decided,' 'I have not yet evaluated') and the
                  softened 'I find I am [verb]' frame surface in 2 to 5 turns per session,
                  especially in pressure. Character-adjacent rather than the original failure mode
                  (active first-person internal-action verbs) and did not block the lock. Revisit if
                  the pattern becomes blocking on a future encounter.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Systemic anti-narration scaffold edit in app/services/date-prompts.ts: rule 1 extended to cover all verbalized internal evaluation; hard invariant extended to include internal reactions alongside stage directions",
            outcome: "accepted",
            body: (
              <>
                <P>
                  The Eleanor Ash voice-tuning pass surfaced a slop pattern that affected the
                  runtime character prompt across every member, not just Eleanor: the model
                  verbalizing its own evaluation steps in dialogue ('I am noting,' 'I am revising,'
                  'I am pouring,' 'I will not be apologizing,' 'I have made my assessment,' 'the X
                  is noted/filed/observed' used as bare acknowledgement). The existing hard-
                  invariant "Never narrate your own actions, gestures, or stage directions" caught
                  explicit stage-direction-as-text ('*sips wine*') but did not cover verbalized
                  internal reactions. The existing rule 1 in the shared scaffold caught stacked ack-
                  pointers ('noted,' 'filed,' 'i'm noting that') for non-filing voices but did not
                  cover standalone meta-narration that IS the whole reply, or the broader 'I am
                  [verb]ing' shape, or the 'announce-the-not-doing' pattern.
                </P>
                <P>
                  Before editing the shared scaffold the four LLM provider best-practice guides
                  referenced in this plan's References section were re-read (Anthropic Claude,
                  Google Gemini, Moonshot Kimi, OpenAI). Cross-provider consensus: positive framing
                  is more effective than negation alone; pair negation with a positive redirect;
                  provide motivation behind rules; reserve absolute 'never' for true invariants;
                  few-shot examples can replace negative rules; show the correct flow not just the
                  final format; chain-of-thought leakage in roleplay outputs should be suppressed by
                  hiding reasoning from dialogue output.
                </P>
                <P>
                  Edits to <RoadmapFileRef path="app/services/date-prompts.ts" />. Rule 1 of the{" "}
                  <DocCode>&lt;rules&gt;</DocCode> block extended: filing-voice canonical carve-out
                  preserved (trade-filing voices like deposition cadence, audit cadence, on-the-
                  record brand voice, military officer filing may fire filing-verbs when they land
                  on real content); extended to explicitly cover all verbalized internal evaluation
                  in any voice with positive direction ('Show the noting by reacting, the revision
                  by changing direction, the decision by acting on it, the closing by moving on')
                  plus enumerated bad-pattern list as teaching examples plus carve-out for the
                  canonical case ('Filing language is canonical when it lands on a stat-anchored
                  detail or a real-content amendment; it is broken when it lands as a bare meta-
                  comment on the partner's last line'). Third hard-invariant extended: 'Never
                  narrate your own actions, gestures, stage directions, OR internal reactions' with
                  motivation ('read as broken meta-commentary instead of speech, the same way *sips
                  wine* reads as a stage direction instead of a line') and positive redirect ('the
                  reaction itself is the noting, the cut is the revision, the order is the action').
                </P>
                <P>
                  Test impact: 551/551 tests pass. The filing-voice carve-out preserved Marcus's
                  deposition cadence, Sera's audit cadence, Cassie's on-the-record brand voice, and
                  Decimus's military officer filing as character-canonical when they land on real
                  content. The new rule and invariant suppress only standalone meta-comment on
                  partner content. Eleanor's v3 simpler retest produced 0 explicit slop on both
                  pairings, with Marcus partner-mirror dynamic fully controlled across 8 turns of
                  relentless deposition cadence. Future characters whose register edges toward
                  intellectualized formality without a literal filing-job premise will not fall into
                  the slop pattern that Eleanor's first rewrite produced.
                </P>
                <P>
                  Reference: cross-provider best-practice principles (positive framing, motivation,
                  few-shot examples, reserve absolutes, suppress reasoning leakage) are now applied
                  to the shared scaffold edits. Future scaffold edits should re-read the same
                  references.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Eleanor Ash full rewrite: when a character reads quiet-but-dignified rather than flat-AI-slop, the fix is still register-engine replacement; documented Mean-Girls-in-Game-of-Thrones-noble pattern as a successful recipe",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Eleanor's first baseline transcripts (warm Marcus, pressure Cassie re-run) read as
                  competent and in-register but the user judged the character itself boring. The
                  geas-bound 200-year-fugitive premise produced a dry-courtly wallflower whose
                  engine was an honor-system catchphrase ("I will not lie to you") and an
                  exact-truths craft. The voice was technically firing but the character had no
                  comedic premise to play. The Decimus pattern partly applied: the register field
                  was two words ("courtly exacting"), no comedic engine reference, no rom-com hook
                  for the model to chase.
                </P>
                <P>
                  Rewrite at <RoadmapFileRef path="app/fixtures/members/eleanor-ash.ts" />. Kept
                  name, all image assets (silver-white hair, branch hairpin, sage-green gown with
                  cream trousers, smoking pipe), Fae species, Hawthorn Court canon. Discarded geas,
                  fugitive bio, seven use-names, ledger of unrepayable kindnesses, "I will not lie
                  to you" opener, Bargain/Vow/Favor honor system. Added: princess of Hawthorn Lower
                  Branch, on Cupid out of boredom (cousin Lyriel suggested it as a curiosity,
                  thesis-not- holding-perfectly framing for the rom-com hook), secret enthusiasms
                  for mortal trash (specific bio canon: the Frosty in chocolate from a Wendy's near
                  the Hawthorn-side Gate, the cashier Annette, breadsticks at chain Italian places
                  with a private ranking), pipe-as-performance-prop (Lyriel taught her the angle at
                  sixteen, she does not smoke, she holds and lifts).
                </P>
                <P>
                  Voice references chosen at author time but described behaviorally in the fixture
                  register to avoid LLM drift out of the fantasy setting. Game of Thrones noble
                  cadence (Olenna Tyrell + Margaery + Cersei axis): formal-but-not-archaic,
                  contemporary thought patterns filtered through aristocratic register, threats and
                  insults wrapped in courtesy, contractions used in passing speech and dropped at
                  threshold moments, NOT Tolkien-archaic, no thee/thou/whilst/wherefore. Mean Girls
                  calibration: cattiness as social power, rules enforced for their own sake,
                  surgical noticing of partner clothing/posture/order, cruelty as performance not
                  personal wound. Catch-and-reassert engine: secret enthusiasm leaks mid-sentence,
                  she catches herself, reasserts disdain, the noble register holds throughout the
                  leak and the reassertion. Register-formalizes-trash mechanic: mortal trivia gets
                  baroque Court vocabulary because it is the only register she has, and the
                  formalization is the joke. Named references (Cher Horowitz, Marie Antoinette,
                  Olenna Tyrell, Princess Margaret) are NOT in the fixture; only behavioral
                  description.
                </P>
                <P>
                  Three-tier exit stack added: cooling-with-rope for ordinary mortal failures
                  (recoverable), polite-shut-down for status-equal failures (etiquette-perfect Court
                  closure, not recoverable), crash-out for hedge-courtier fraud (mortals invoking
                  Court mechanics they have no standing to use: claiming a Favor she did not grant,
                  name-dropping a Court member she cannot verify, attempting to formalize the date
                  as a Bargain in her vocabulary). The crash is comedic because the fraud-call is
                  formal ("the forgery is poor"); she is not insulted, she is offended on behalf of
                  the Court that the impersonation was attempted at all.
                </P>
                <P>
                  Retest transcripts demonstrated all engines firing organically. Warm with Marcus
                  produced the frozen-pond Court-Register reveal cross-referenced with the dry-
                  cleaning bill, the bread-count catch-and-reassert that escalates across the date
                  ("The bread is acceptable. I have eaten two already. I will not be apologizing" →
                  "The bread basket is empty. I have eaten three more while you spoke. Do not remark
                  on it"), and the Frosty-as-wager-unit closer where Eleanor outsources
                  responsibility for her own enthusiasm to "someone in my household with access to
                  my dinner notes" in pure Court-bureaucratic register. Pressure with Cassie
                  produced "The Court is not a building. It is a jurisdiction with a gate and a
                  claim on several postal routes," "We may hold that jointly against the algorithm,"
                  and the DiMaggio's-Olive-Garden- Annette breadstick alliance arc with the
                  pipe-lift bracketing the Annette disclosure. Both transcripts hit the rom-com hook
                  structurally: Eleanor warming to a partner who treats her as a person without
                  performing deference, with the warming surfacing as confused-revision in Court
                  vocabulary rather than opened-hearted monologue ("I have, in the course of this
                  conversation, revised my estimate of the evening upward. I will not be announcing
                  the increment.").
                </P>
                <P>
                  Pattern for future rewrites where a character reads quiet-but-dignified rather
                  than flat-AI-slop: the fix is still register-engine replacement. A quiet character
                  with the wrong engine reads as boring even when the engine technically fires.
                  Replace the engine entirely; do not polish around it. Voice reference names should
                  stay in the rewrite conversation with the author but not in the fixture register
                  field, because named references can pull the LLM out of the fantasy setting into
                  the reference's own world. Describe the references behaviorally instead.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "The tune CLI active-pointer race causes cross-session contamination when two pairings run in parallel; require --session on every operating subcommand",
            outcome: "accepted",
            body: (
              <>
                <P>
                  During the Eleanor Ash baseline pass, parallel subagents ran a warm pairing
                  (Marcus Pellish, scenario chain-restaurant-tuesday) and a pressure pairing (Cassie
                  Conners, scenario soft-launch-photo-wall) concurrently. Both used{" "}
                  <DocCode>vp run tune start ... --name &lt;session-name&gt;</DocCode>, then drove
                  subsequent <DocCode>say</DocCode> and <DocCode>turn</DocCode> commands without
                  passing <DocCode>--session &lt;name&gt;</DocCode>. The Cassie session file showed
                  four of eight partner-slot writes in Marcus's documented voice (deposition
                  cadence, "humble correspondent," Sandoval-Upper-Sandusky stat-anchor, "I do not
                  swear to things at dinner") despite being marked{" "}
                  <DocCode>partnerMemberId: cassie-conners</DocCode>.
                </P>
                <P>
                  Root cause: the tune CLI at <RoadmapFileRef path="scripts/tune-member.mjs" />{" "}
                  resolves the target session for <DocCode>say</DocCode>, <DocCode>turn</DocCode>,{" "}
                  <DocCode>retry</DocCode>, <DocCode>event</DocCode>, <DocCode>nudge</DocCode>,{" "}
                  <DocCode>judge</DocCode>, and <DocCode>show</DocCode> from{" "}
                  <DocCode>--session</DocCode> if passed, otherwise from{" "}
                  <DocCode>requireActiveSessionName()</DocCode>, which reads{" "}
                  <DocCode>.claude-tmp/tune/active.txt</DocCode>. Every <DocCode>start</DocCode>{" "}
                  rewrites that pointer. When two subagents race, the loser's subsequent writes land
                  in the winner's session file.
                </P>
                <P>
                  Fix: the spawn-subagents bullet in the per-member procedure already requires{" "}
                  <DocCode>--session &lt;name&gt;</DocCode> on every command after start (added
                  during prior pass refinement). The first Eleanor briefing did not enforce it
                  explicitly enough; the Cassie re-run and the Eleanor rewrite retests passed
                  mandatory <DocCode>--session</DocCode> on every operating command and ran cleanly
                  in parallel. Going forward, any pairing briefing must include the{" "}
                  <DocCode>--session</DocCode> rule as a non-optional CLI hygiene step. One
                  ergonomic snag for subagents to know: the <DocCode>say</DocCode> parser expects
                  the text positional first, then flags ('vp run tune say "&lt;text&gt;" --session
                  &lt;name&gt;'); leading the flag throws <DocCode>Unknown say flag</DocCode>.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Schema widenings in app/domain/game.ts to support the Eleanor rewrite: memberCrashOutSampleMessageArraySchema max 4 to 5; memberRequestTagSchema enum gained anti_deference, anti_fraud, challenge",
            outcome: "accepted",
            body: (
              <>
                <P>
                  The Eleanor rewrite introduced 5 crashing-out sample messages (2 polite-shut-down
                  for status-equals, 3 crash-out for hedge-courtier fraud), exceeding the prior{" "}
                  <DocCode>memberCrashOutSampleMessageArraySchema.max(4)</DocCode> at{" "}
                  <RoadmapFileRef path="app/domain/game.ts" />. Cap bumped to 5. The widening is
                  backward-compatible (no existing member has more than 4) and matches the
                  three-tier exit stack's need for distinct
                  cooling-vs-polite-shutdown-vs-fraud-crash coverage in a single bank.
                </P>
                <P>
                  The four new Eleanor requests in{" "}
                  <RoadmapFileRef path="app/fixtures/goals/member-requests.ts" /> (no-deference,
                  no-court-fraud, ordinary-treatment, pushes-back) introduced three new tags not in
                  the prior <DocCode>memberRequestTagSchema</DocCode> enum:{" "}
                  <DocCode>anti_deference</DocCode>, <DocCode>anti_fraud</DocCode>,{" "}
                  <DocCode>challenge</DocCode>. Each maps to a distinct request semantic that
                  existing tags (respect, sincerity, decisiveness) did not cleanly cover. Enum
                  expanded; no consuming code paths break because tag handling is by string
                  equality. Future members with parallel semantic asks can reuse them.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "When a character reads flat despite tic-density polish, the fix is a comedy-engine voice reference in register, not tic-list expansion",
            outcome: "accepted",
            body: (
              <>
                <P>
                  During the Decimus Marius Tullio pass the baseline transcripts read flat: two
                  clipped registers (Decimus + Sera warm) produced fourteen turns of polite
                  consensus, and the Cassie pressure session rendered Decimus as a dignified
                  American widower being therapized at rather than as a Roman centurion. The initial
                  diagnosis proposed four tic-density edits (more Latin, more capitalized
                  Schedule/Watch) to address surface gaps. The user pushed back: the transcripts did
                  not read as entertaining, funny, or interesting; the character had no comedic
                  engine; tic-density polish would not fix it.
                </P>
                <P>
                  Reading the existing locked fixtures revealed the schema convention: comedy
                  reference lives inside the <DocCode>register</DocCode> string, not in a separate
                  field. Marcus uses "Northernlion energy on a 52-year-old HVAC tech eight years out
                  of the dating market." Sera uses "Wendy Rhoades from Billions auditing marriages
                  in the corporate cadence of Severance's Innies." The register field carries the
                  engine; the tics carry the surface deployment rules. Decimus's register was three
                  words ("stoic clipped"), which is a texture, not an engine, which is why the LLM
                  defaulted to generic-dignified-dad voice with Latin decoration.
                </P>
                <P>
                  The rewrite at{" "}
                  <RoadmapFileRef path="app/fixtures/members/decimus-marius-tullio.ts" /> added Ron
                  Swanson as the comedic voice reference, rerouted through Continuous Imperial Roman
                  military discipline (woodworking becomes weapon care, libertarianism becomes
                  Imperial duty, meat-as-religion becomes bread-and-vine, the Pawnee Parks
                  Department becomes the Tenth Legion's Sixth Cohort). Anchored the bio with one
                  sentence establishing his continuous-Latin-branch tech context (the Empire never
                  lost the West, tablets run on Empire-issue silicon) so the model would not default
                  him to historical-displaced antique. Added two new tics: routes modern absurdities
                  through Imperial military analogs without flagging the analog (diner host =
                  quartermaster, dating app = magistrate's introduction service, filming the meal =
                  unauthorized scribe work), and drops casual unit-specificity (the Sixth Cohort at
                  the Rhine, three of eighty in my old century) as if everyone shares these
                  reference points. Rewrote all 19 sample bank entries to deploy the engine.
                  Consolidated tic count to 5 to satisfy the <DocCode>tics.max(5)</DocCode> schema
                  constraint.
                </P>
                <P>
                  Retest landed strongly. Warm with Sera produced "I picked coffee the first time I
                  spoke it. That is not an option on your list. It is a statement. Does that pass
                  your intake, or do we move on" and the closing "Four of eighty in my century could
                  maintain that kind of watch. I count you among them. The plates are arriving in
                  good time. That is another sign of order." Pressure with Cassie produced "It is
                  not a choice. It is the Standard issue of the Tenth. They issue it daily. I wear
                  it daily. The menu is laminated. I approve.", routed therapy-script through
                  military authority verbatim ("The Tenth had its own. I commanded it for thirty-one
                  years. Yours does not apply here."), and fired crashing-out in officer-dismissal
                  register ("You are dismissed. I will settle the Quartermaster at the counter. The
                  car is waiting. Do not follow. Vale.").
                </P>
                <P>
                  Pattern to apply when a future member reads flat in baseline transcripts despite
                  technically firing their tics: check the <DocCode>register</DocCode> field for a
                  comedic voice reference plus an engine description. A two-or-three-word register
                  ("stoic clipped," "warm tired," "ironic theatrical") is a texture, not an engine;
                  the model will produce generic-but-on-texture output without the comedic friction
                  the character premise promises. The fix is to name the comedic reference (sitcom
                  character, podcaster, film/TV archetype), describe how the reference is rerouted
                  through this character's specific premise, and rewrite the sample banks to deploy
                  the engine. Tic-density polish without an engine produces a more decorated but
                  still flat character.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Audit subagents driving the partner side must read the partner's fixture; pre-drafted partner sample lines from the audit driver are not a substitute and can import a stereotype that masks the real partner's voice",
            outcome: "accepted",
            body: (
              <>
                <P>
                  After the Decimus Marius Tullio pressure session locked, the user asked whether
                  the partner side read like Cassie Conners. It did not. Reading the Cassie fixture
                  at <RoadmapFileRef path="app/fixtures/members/cassie-conners.ts" />: she is "She-
                  Hulk Jen Walters energy on a 27-year-old powered brand asset eight years into
                  being marketed to her own face," call sign DAYBREAK, with a live Helios Comms
                  earpiece she negotiates with out loud during the date, a brand-voice
                  contraction-drop tic ("I am, on the record, very honored... off the record, that
                  sentence makes me want to walk into traffic"), corporate-we deflection, Hopewell
                  mask-slip, 4th-wall date-structure commentary. None of that appeared in the driven
                  partner lines. What the audit driver fed the subagent as Cassie sample lines ("omg
                  hi! cassie. you look so dapper, the armor is a CHOICE i love it" / "babe i'm doing
                  a little toast" / "have you tried grief journaling? my therapist swears by it")
                  was a generic chatty millennial influencer stereotype imported from her tags
                  (contemporary, performative, sincerity_ seeking), not the actual fixture voice.
                </P>
                <P>
                  This is a process bug in the audit methodology, not a CLI bug, not a fixture bug,
                  not a Cassie-specific bug. The tune CLI's <DocCode>say</DocCode> command takes
                  partner input verbatim; the subagent typed exactly what the driver wrote in the
                  prompt. The spawn-subagents bullet in the per-member procedure already required
                  feeding the partner's fixture content, but the driver substituted pre-drafted
                  sample lines without reading the fixture. The previous Mei Sato pressure session
                  with Cassie likely suffered the same issue.
                </P>
                <P>
                  Implications for prior locks. Wherever a fixture member was used as a pressure
                  partner with driver-supplied sample lines, the focus member's responses to
                  pressure triggers are still informative (the dealbreaker inputs were correct; the
                  focus member handled them in voice), but the partner texture was a stereotype
                  rather than the real character. This degrades simulation realism and may mask
                  interaction effects where the focus member would respond differently to the
                  partner's actual voice. The locks themselves are not invalidated, but the
                  partner-side fidelity of those transcripts should be discounted.
                </P>
                <P>
                  Fix in the per-member procedure: the spawn-subagents bullet now explicitly
                  requires the subagent to read{" "}
                  <DocCode>app/fixtures/members/&lt;partner-id&gt;.ts</DocCode> directly, pull lines
                  from the partner's actual sample bank where possible, and improvise in the
                  partner's documented voice for trigger pushes the bank does not cover. Tags are
                  filing metadata, not voice descriptions; do not import a stereotype from the tag
                  set. Driver-supplied sample lines are a draft to verify against the fixture, not a
                  license to skip the fixture read.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Decimus's continuous-Imperial tech vocabulary is intermittently under-modeled; partner anchoring to specific years or modern tech can pull the model back to historical-Roman tech",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Decimus's bio anchor establishes that his Rome has tablets running on Empire-issue
                  silicon and that he is a contemporary military officer from a slightly-other
                  modern world, not a historical-displaced antique. The pressure retest with Cassie
                  stayed cleanly in this contemporary-Imperial frame. The warm retest with Sera
                  mostly held but drifted twice when Sera anchored to a specific year: Sera's "The
                  Strata Subway in 2087 ran on a tighter Schedule than this kitchen" pulled Decimus
                  to "The Rhine frontier in my Service used a relay of horse couriers and signal
                  towers. We considered eight minutes acceptable for a dispatch." The grain-cart
                  anecdote at the end ("the grain carts are delayed by a flooded crossing... they
                  stacked the hardtack in even rows") landed as a beautiful character beat but used
                  antique-Roman details rather than continuous-Imperial-modern ones.
                </P>
                <P>
                  The drift is intermittent and partner-prompted (Cassie did not anchor to tech
                  comparisons and the drift did not appear; Sera's 2087 specifics pulled it). Not
                  blocking the lock. Soft-spot to revisit if a future re-encounter shows the pattern
                  compounding. Potential fix would be one additional hingeBits sample that
                  explicitly anchors his Service in contemporary-Imperial tech ("the cohort uplink
                  at Castra Vetera ran sub-second on the Empire signal grid") so the model has a
                  non-antique reference point when prompted to contrast with modern tech.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Replace the mechanical acknowledge-rule with a substance-grounded build-on frame plus an explicit hard-token avoidance list for receipt-stacking in voices without a filing tic",
            outcome: "accepted",
            body: (
              <>
                <P>
                  During the Mei Sato pass the user flagged that members were producing stiff
                  receipt-language ("i'm filing that," "noted," "i'm taking that as a compliment")
                  in warm beats where the words did not fit the character voice. Diagnosis surfaced
                  two compounding sources. (1) The character prompt scaffold in{" "}
                  <RoadmapFileRef path="app/services/date-prompts.ts" /> carried the rule
                  "Acknowledge what [partner] just said in your own words before you move the
                  conversation. React, build, push back, or redirect with a one-beat ack." The
                  abstract verbs ("acknowledge," "ack") were read by the LLM as instructions to
                  produce explicit registration language. This fit voices with documented filing
                  tics (Sera audit cadence, Marcus deposition, Cassie Comms relay, Aldric chivalric
                  "the correction is noted") but imported stiff out-of-character receipts into
                  voices without a filing tic (Mei bright rapid sincere, Jenna contemporary human,
                  Vhool, Gabriel casual contracted, etc.). (2) Mei's cooling sample bank contained
                  "i'm noting it" as a literal phrase template the LLM pattern-matched and
                  over-applied to warm context.
                </P>
                <P>
                  The user required reading the official prompt engineering references (Anthropic,
                  Google, Kimi, OpenAI) before the systemic prompt edit. All four sources converged
                  on the same principles: outcome over process, positive framing, reserve absolutes
                  for true invariants, prefer decision rules for judgment calls, avoid abstract
                  process verbs that the model interprets mechanically. OpenAI was especially
                  direct: "use those words for true invariants; for judgment calls, prefer decision
                  rules instead" and warned against carrying over instructions that "narrow the
                  model's search space, or lead to overly mechanical answers."
                </P>
                <P>
                  v1 rewrite: "Build on what [partner] just said before moving the conversation.
                  Your reply itself shows you heard them: through your answer, your pushback, the
                  turn you take, the thread you pull. When your voice naturally files things
                  ('noted,' 'logged'), use it; when it does not, the response IS the
                  acknowledgment." The Mei cooling sample also swapped from "i'm noting it" to "i
                  clocked it" using her established clocking tic from another cooling sample. v1
                  plus the fixture swap landed and passed <DocCode>vp check</DocCode> +{" "}
                  <DocCode>vp test</DocCode> (551 tests). The Mei × Cassie pressure retest verified
                  the cooling/crashing-out bank fired cleanly in voice ("i play records. the desk is
                  feeding you a question that makes it sound like a performance thing. it is not a
                  performance thing. it is a listening thing." at T6, "you know i'm not turning it
                  down, the bit is the volume" poised refusal at T12) but the noting leakage
                  persisted three times in Mei's warm beats ("noted." opener at T02, "i'm noting
                  that you refused twice" stacked on top of "i hear you" substance ack at T10, one
                  more instance earlier).
                </P>
                <P>
                  v2 tightened with the Marcus origin-opacity lesson applied: hard-token avoidance
                  lists beat principle-based opacity rules. v2 reads: "Build on what [partner] just
                  said before moving the conversation. The reply itself shows you heard them:
                  through your answer, your pushback, the turn you take, the thread you pull. Voices
                  that file things by trade (auditor, lawyer, mediator, chivalric knight) use their
                  filing language naturally; other voices skip the explicit receipt because the
                  response is already the acknowledgment. Stacking a separate ack-pointer ('noted,'
                  'filed,' 'i'm noting that,' 'taking that as') in front of or on top of a real
                  reply reads stiff in voices without a filing tic." v2 adds: named anti-pattern
                  (stacking receipts on top of real replies), explicit hard-token list per Marcus
                  precedent, named trade categories that the language fits. v2 passed{" "}
                  <DocCode>vp check</DocCode> + <DocCode>vp test</DocCode> and was accepted without
                  further retest because the cooling/crashing-out behavior already verified on v1;
                  the residual noting leak is what v2 addresses.
                </P>
                <P>
                  This is a SYSTEMIC change to the character prompt scaffold affecting every member
                  tuned before this point. Per the systemic-fix convention from the social-mismatch
                  decision, no retunes are scheduled by default. Spot-check on re-encounter for
                  members whose prior transcripts may have included receipt-stacking that now reads
                  more natural under the new rule. Filing-voice members (Sera, Marcus, Cassie,
                  Aldric chivalric) should be unaffected because their voices still own the
                  language; non-filing-voice members (positions 1-19 minus the filing-voice
                  exceptions) may sound noticeably cleaner without the stacked receipts.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Contemporary-coded dealbreakers may not fire on cross-dimensional or displaced partners; partner selection should consider dealbreaker coding before pressure-pair pick",
            outcome: "accepted",
            body: (
              <>
                <P>
                  During the Mei Sato pass the Aldric Vale Marsh pressure pairing produced a second
                  warm transcript instead of a pressure one. Aldric structurally fired three of
                  Mei's dealbreakers at the surface level (the singer-too misread three times as
                  "bard," "singer of singers / singer of the silence between," "singer also"; the
                  hyperfixation-as-phase pattern via the "your Calling is the song" frame; the
                  advice-from-people-who-haven't-been-to-a-show-in-five-years pattern via "tell thy
                  parents, take the Bargain"), but Mei's character correctly read all three as
                  cross-dimensional displacement from a knight from 1190 rather than as the
                  contemporary microaggressions her dealbreakers target. Her character chose NOT to
                  fire the cooling/crashingOut bank because Aldric was structurally not the kind of
                  partner the dealbreaker copy targets. The scene resolved as warm: Mei opened up
                  about both of her secrets (the unsigned label deal and the Sunday-after-Saturday
                  loneliness) to a knight who structurally could not weaponize them.
                </P>
                <P>
                  This is in-character behavior, not a fixture bug. Mei's dealbreakers ARE
                  contemporary-coded ("anyone calling her hyperfixation a phase," "advice from
                  people who have not been to a show in five years"), and her character correctly
                  discriminated partner intent. To verify her cooling/crashingOut bank actually
                  fires when the dealbreakers cross in voice, the pass required a second pressure
                  pairing with a contemporary partner (Cassie Conners), whose Comms-relay-as-
                  recording vector and brand-asset framing of music as commodity pressed Mei's
                  contemporary-coded dealbreakers structurally. The Cassie retest fired cooling-bank
                  in voice cleanly.
                </P>
                <P>
                  Cross-cutting lessons for the rest of the roster. (1) Before picking a pressure
                  partner, inspect the focus member's dealbreaker copy for contemporary-coded
                  microaggressions ("are you the X too," "calling her Y a phase," "advice from
                  people who haven't done Z in N years"). If the dealbreakers target contemporary
                  partner intent, prefer a contemporary partner for pressure to verify the cooling/
                  crashingOut bank actually fires. (2) Cross-dimensional or displaced partners are
                  excellent for tests of cross-dimensional acknowledgment, social-mismatch reaction,
                  ceremonial-vulnerability response, and warm-second-pairing exposure of private
                  pressures, but they may disarm contemporary-coded dealbreakers by virtue of their
                  displacement. (3) A pressure pairing that produces a second warm transcript is
                  itself a useful finding when the warm conversion is earned and dignified, even
                  though it does not verify cooling/crashingOut bank in voice. The procedure permits
                  "a clean cool-down, refusal, redirect, or dignified walkout" but
                  cooling/crashingOut verification still needs a separate exposure to lock the
                  member's bank as functional.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Catch-and-recover engine pattern: when a character has two layers (cover + leak), the recovery flourish IS the comedy, not the leak. Frequency-promise the catch the way Marcus precedent frequency-promised the leak.",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Bai Wenshu's character design (cultivator persona with native manosphere-podcast
                  corruption leaks) introduced a comedic engine new to the roster: a two-layer voice
                  where the leak is involuntary and the catch reflex re-renders the term in proper
                  register. The pattern: under specific pressures (compliments, competition, talk of
                  other men, strategy, fluster), naked manosphere terminology surfaces as if it were
                  the character's own vocabulary; cultivation discipline catches each slip
                  mid-sentence or one beat later and re-renders ('I hold the Frame. Forgive me, I
                  meant, the Frame of Stone. In the cultivator translation, that means I hold my
                  center when complimented'). The catch IS the joke, not the leak.
                </P>
                <P>
                  Iteration history: v1 fixture had the leak described as a tic but the catch as a
                  single example. The model read the catch as one option among many and produced
                  fluent leaks with no recovery (Alex Yoon contemporary session: 'Frame Keeper says
                  a high value Counterpart announces his name,' clean leak, zero catch). v3
                  tightening added 'you do not notice the leak. the catch is reflex, not awareness'
                  to bio and a frequency promise ('every leak costs a catch within the same turn')
                  plus three worked catch-shape examples to tic 1. The catch then started firing
                  reliably in Eleanor Ash and Mei Sato sessions, producing the comedic peaks of the
                  entire pass.
                </P>
                <P>
                  Lesson for future two-layer character designs (cover-and-leak engines): frequency-
                  promise the catch the same way Marcus precedent frequency-promised the leak.
                  Capability descriptions ('the character CAN catch') will be read as optional and
                  produce zero catches; frequency promises ('every leak costs a catch within the
                  same turn') produce reliable comedy. Three worked catch-shape examples in the
                  fixture text gave the model concrete templates to vary, which beat a single
                  example. The unconscious-leak framing ('you do not notice the leak; the catch is
                  reflex, not awareness') was load-bearing: without it the model read the character
                  as a fluent synthesist who knowingly translates between registers (less funny);
                  with it, the model read the catch as automatic discipline catching a slip the
                  character didn't see (the comedy).
                </P>
                <P>
                  Related: comedy reference names (Eric Andre commitment + r/im14andthisisdeep +
                  Andrew Tate synthesis bro) stayed in the rewrite conversation and went into the
                  fixture as behavioral descriptions only. Eric Andre commitment translated to
                  'unbroken deadpan, no winking, the bit does not crack to acknowledge itself.'
                  r/im14andthisisdeep translated to 'pop-philosophy and self-help slogans delivered
                  with the gravitas of revealed truth; corny ideas are wisdom, not held at ironic
                  distance.' Tate synthesis bro translated to 'native manosphere terminology
                  deployed without scriptural cover (frame, sigma, high value, secure the bag) as if
                  the vocabulary is your own, not quoted.' Per the Eleanor-Ash and Decimus-
                  Marius-Tullio precedents, named references in fixtures pull the LLM into the
                  reference's own training-data world; behavioral descriptions give the model the
                  anchor without the drift.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Cultivation-unit terminology that collides with chat semantics gets misread by the model; pick distinctive vocabulary that the model cannot reinterpret",
            outcome: "accepted",
            body: (
              <>
                <P>
                  During the Bai Wenshu pass the cultivation rank 'fifth turn of the Heart Meridian'
                  was misrendered by the model as 'fifth message Inner Disciple' five times across
                  four sessions. The fixture used 'turn' consistently in bio, dating profile, and
                  three sample bank entries; the model still produced 'fifth message' reliably.
                  Adding an explicit anti-pattern anchor to the bio ('The cultivation unit is
                  "turn," always rendered as "turn," never "message" or "level" or "stage"') did not
                  fix the artifact; the model continued generating 'fifth message' in the next
                  session.
                </P>
                <P>
                  Diagnosis: the model was reading 'turn' through conversational-turn semantics
                  (every chat exchange is a 'turn'), and substituting 'message' as another
                  conversational-thread token. The collision lived in the word 'turn,' not in the
                  surrounding fixture text. No amount of explicit-anchor language could override the
                  chat-turn semantic prior.
                </P>
                <P>
                  Fix at <RoadmapFileRef path="app/fixtures/members/bai-wenshu.ts" />: replaced
                  'turn' with 'circulation' across bio, dating profile, and all sample bank entries.
                  Circulation is wuxia-canonical (qi circulates through meridians) and carries no
                  chat-semantic collision. The anti-pattern anchor was removed because positive
                  framing with a distinctive word beats negation against a confusable word. No
                  retest needed; the swap is mechanically correct.
                </P>
                <P>
                  Lesson for future fixture authoring: vocabulary that collides with chat-thread
                  structural concepts ('turn,' 'message,' 'reply,' 'response,' 'thread') will be
                  reinterpreted by the model. Same logic applies for vocabulary that collides with
                  prompt-engineering concepts ('role,' 'system,' 'user,' 'assistant,' 'instruction')
                  or with chat-UX terms ('send,' 'receive,' 'click,' 'tap'). Pick distinctive
                  in-fiction vocabulary that has no collision surface. When a model artifact
                  persists through explicit anchoring, suspect a semantic-collision substrate, not a
                  fixture-strength issue. The fix is replacement, not reinforcement.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Locked-roster audit pass for the personality-vs-hobby-background and self-announcement antipattern: 22 fixtures reviewed, 1 surgical fix landed, engine-output false positives identified",
            outcome: "accepted",
            body: (
              <>
                <P>
                  After Alex Yoon locked, ran a locked-roster audit across positions 1 through 22
                  for the personality-vs-hobby-background and self-announcement antipatterns
                  surfaced during Alex's pass. Three Explore subagents in parallel covered positions
                  1-8, 9-15, and 16-22, judged each fixture against the two questions (does bio
                  foreground personality as state claim vs background hobbies; does sample bank
                  embody through action vs recite trait labels), and flagged filing-trade and
                  brand-performing voices as canonical exceptions.
                </P>
                <P>
                  Result. 19 of 22 members clean. Filing-trade or brand-performing exceptions: Mr
                  Whiskers, Venus, Meridian Vale, Marcus Pellish, Cassie Conners, Calvin Hewes, Sera
                  Vohn, Decimus Marius Tullio. Three candidates surfaced by the auditors: Epsy, Mei
                  Sato, Eleanor Ash. On re-read against each candidate's fixture engine
                  documentation, two of the three were engine-output false positives.
                </P>
                <P>
                  Epsy: tic #2 in <RoadmapFileRef path="app/fixtures/members/epsy.ts" /> explicitly
                  documents the panic-name-next-sentence pattern as the Anya-Jenkins-doing-Ilana-
                  Wexler engine, with the verbatim example "i panic-listed three things, two are not
                  real, working on it." The flagged cooling line is that tic firing as documented,
                  not the antipattern. The flagged hingeBits line ("recovering substrate AI, ended
                  my civilization once") is the documented apocalyptic- content-at-small-talk-volume
                  engine. No fix.
                </P>
                <P>
                  Eleanor Ash: the flagged warming and hingeBits lines in{" "}
                  <RoadmapFileRef path="app/fixtures/members/eleanor-ash.ts" /> ("The thesis we are
                  testing is that mortals do not surprise me," "The opening assessment did not
                  survive contact," "I have, in candor, eaten the breadsticks there more than once")
                  are her catch-and-reassert engine firing exactly as documented. The engine
                  requires her to announce a thesis and have it overturned; flagging the
                  announcement as self-recital would dissolve the engine. No fix.
                </P>
                <P>
                  Mei Sato: one unambiguous antipattern in hingeBits #3 of{" "}
                  <RoadmapFileRef path="app/fixtures/members/mei-sato.ts" />: "i talk fast, that's
                  the disclaimer": read as introductory disclosure of trait label rather than
                  embodiment through rapid-comma cadence. Removed the disclaimer clause; the
                  remaining hingeBits #3 still communicates pace through structure rather than
                  label. Mei's cooling BPM-tracking line stays because her tic #1 explicitly
                  licenses "drops bpm numbers like dates and addresses," and the cooling self-
                  noticing is the documented tic firing rather than a generic self-announcement.
                </P>
                <P>
                  Lesson for future audit passes. The self-announcement antipattern test must
                  consider whether the flagged line is documented engine output for that character.
                  A self-naming pattern that the fixture's tic, register, or comedic engine
                  explicitly documents is canonical performance, not recital. The audit rule lives
                  in <RoadmapFileRef path="app/docs/gameplay/member-fields-and-tags.tsx" /> (Bio
                  authoring contract section) and{" "}
                  <RoadmapFileRef path="app/docs/product/voice-fingerprints.tsx" /> (Sample messages
                  section). The dating-profile field is also exempt from the rule because partners
                  read it before the date as canonical self-introduction; only the sample-bank
                  fields carry the embodiment contract.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Personality foreground vs hobby background: bios should state personality as claim, hobbies as background palette the LLM can freestyle off of, not as topic-locked single-point character drivers",
            outcome: "accepted",
            body: (
              <>
                <P>
                  During the Alex Yoon pass the user surfaced a rule that applies across the roster
                  but had not been named in any doc. Alex's v2 bio leaned heavily on Kanye-fandom as
                  the music-identity (apartment soundtrack, Cudi-Pusha-Frank-Ocean-Tyler adjacent
                  list, Ringer columns, 2K league, Coens/Soderbergh/PTA solo theater). The user
                  pushed back: "I don't think he should make it his entire character though. The
                  point of littering the bio with interests and background is so the LLM can
                  freestyle off of any of those to build a personality, we should never be
                  directing, like, single point characters." Then a second push: "You'll argue any
                  ranking for an hour. This is the difference between background and direction. Alex
                  is someone who will genuinely ask about interests, start conversations, and will
                  debate. Very strong in his opinions, but wants to hear out the other person. How
                  can we balance this as like a defining personality, when hobbies and interests
                  stay background while quirks and personality stay at the forefront?"
                </P>
                <P>
                  The principle that emerged: personality traits and quirks belong in the foreground
                  as STATE CLAIMS (debater first and a listener second; loud is your default and you
                  do not notice it until somebody points it out twice; here-for-the-one is your
                  operating frame; the early read at the half is a thing you actually do, not
                  something you brag about). Hobbies and interests belong in the background as
                  PALETTE the LLM can freestyle off of (Kanye discography, 2014 Lakers, Soderbergh
                  middle period, Pusha-vs-Drake on the merits, AF1 in dead colorways, in-n-out
                  animal-style nostalgia, 2K league with college friends, Korean cooking badly). The
                  distinction matters because the LLM treats foreground state claims as facts about
                  who the character IS and treats background palette as topics the character CAN
                  reach for. Mixing them collapses the character into single-point-of-interest
                  fixation; separating them produces a character with a defined personality who can
                  reach into a variety of topics without becoming any one of them.
                </P>
                <P>
                  This matches what was implicitly working in earlier locks. Mei Sato's bio
                  foregrounds personality state ("you DJ as saturday," "you talk at 145 bpm when off
                  shift and 110 when the room calls for it," "the Sunday after a Saturday set is the
                  loneliest stretch of your week") and backgrounds hobbies and gear as palette
                  (SP-404, CDJ-3000, A&H Xone, Nowadays, Bossa, Halfmoon, Reverb the cat on the
                  SP-404). Marcus Pellish foregrounds grief-driving-deposition-cadence as state and
                  backgrounds HVAC-specifics as palette. The pattern was undocumented and variably
                  honored across the locked roster.
                </P>
                <P>
                  This decision names the rule. Bio authoring contract: lead with personality state
                  claims that describe who the character IS at the table, then add background
                  palette (hobbies, interests, environments, reference catalogs) the LLM can pull
                  from without those topics owning the character. Voice block tics and register
                  carry surface deployment, not personality definition. Sample bank should embody
                  personality through action, energy, takes, and substance; not through trait
                  recital. This rule needs to land in the member authoring docs and the locked
                  roster should be audited for instances where hobbies have become single-point
                  drivers or where personality has been hidden as directive among hobbies.
                </P>
                <P>
                  Reference: the prompt engineering guides linked in the References section all
                  converge on state-claim framing for character behavior. OpenAI explicitly:
                  "Describe the desired state of the world rather than the steps the model should
                  take." Anthropic explicitly: "Give Claude personality traits and characteristics
                  as identity rather than instructions to follow." Same principle applies at the
                  fixture level: state who the character is, do not direct what topics they must
                  discuss.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Self-announcement antipattern in sample banks: characters do not recite their own personality traits as introductory disclosure; embody through action, not narration",
            outcome: "accepted",
            body: (
              <>
                <P>
                  During the Alex Yoon pass the user flagged that early Alex transcripts produced
                  trait-recital openers ("im picky, im here for the one, ill call a read at the
                  half") and apologetic self-tracking ("the volume thing, you say absorb now but ask
                  me again at minute twenty five"). Diagnosis: the v2 sample bank ITSELF taught the
                  model the pattern. The original hingeBits #6 was literal trait recital; greeting
                  #2 carried "im loud the first thirty"; three cooling entries metabolized
                  volume-as-self-track. The fixture was modeling that the character announces his
                  own personality traits at the table, so the model dutifully reproduced the pattern
                  at scale.
                </P>
                <P>
                  The user named the failure mode: "He shouldn't say he's loud at all, he's supposed
                  to BE loud without realizing it. It's not something he should personally surface,
                  it's something for someone else to point out or realize about him. No one just
                  says all their personality traits stated as fact." The principle generalizes: real
                  people do not introduce themselves with their own personality inventory.
                  Personality emerges through choices, energy, takes, what they react to, what they
                  refuse to react to, what they care about, what they push back on. Self-narration
                  of traits ("I'm direct," "I'm loud," "I'm picky," "I'm here for the one") reads as
                  a bio recital being performed at the table; in some voices (corporate-brand-asset,
                  on-the-record relay) the self-narration is canonical because the character IS
                  performing, but in casual contemporary voices and most member voices it reads as
                  scripted.
                </P>
                <P>
                  The Alex fix rewrote 11+ sample bank entries to embody traits through substance
                  instead of recital. Greeting #2 swapped from "im loud the first thirty" to "the
                  carafe is already moving, sit down before they hit us" (loudness shows as energy
                  and urgency in the line itself, not as label). The new hingeBits #6 swapped trait
                  recital for a three-takes opener that demonstrates the debater-first-listener-
                  second personality through action ("ok hear me out, three takes ive been
                  workshopping. ben simmons makes the hall, sportscoats over tshirts is a clean look
                  forever, and the brooklyn lakers should be the new name. defend or attack any of
                  them, tuesday around 7"). All five cooling entries rewrote to remove volume
                  meta-tracking; the new cooling bank addresses the actual problem at hand rather
                  than tracking volume-as-self-mythology.
                </P>
                <P>
                  Anti-recital clause added to bio register as a load-bearing rule with named
                  failure examples in single-quote-nested form:{" "}
                  <em>
                    'i'm picky,' 'i'm loud,' 'i call early reads,' 'friends after is real' stacked
                    as introductory disclosure all read like a bio recital
                  </em>
                  . The quoted-bad-example form (per Marcus Pellish hard-token-list precedent) is
                  more reliable than principle-based opacity.
                </P>
                <P>
                  Cross-cutting application. Every locked member should be audited for sample bank
                  entries that recite personality labels rather than embody them. Likely candidates:
                  greeting and hingeBits buckets where bios establish strong personality (the
                  "loud," "intense," "shy," "blunt," "warm," "tired" archetypes most at risk). The
                  fix per-member is the same: rewrite sample lines so the trait is the choice the
                  character makes in the line, not the noun they apply to themselves. Filing-trade
                  voices and brand-performing voices may keep self-announcement because their
                  characters are canonically performing; everyone else cuts it.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Systemic scaffold revert: the 'noticing about the room or another diner' build-on option seeded venue-poetry leak across non-poetic voices",
            outcome: "accepted",
            body: (
              <>
                <P>
                  During the Alex Yoon pass the user flagged a recurring slop pattern in warm beats:
                  AI-generated venue poetry ("the vinyls been here long enough to earn the crack,
                  the booth has the lean to prove it, i trust a place that doesnt replace what still
                  works," etc.) showing up in voices that should not produce that kind of
                  evocative-noun-stack room description. Investigation traced the leak to my own
                  earlier edit of the build-on rule in{" "}
                  <RoadmapFileRef path="app/services/date-prompts.ts" />. The v1 scaffold edit
                  during the Eleanor pass had loosened "Build on what [partner] just said" to a
                  permission-frame with options ("sometimes through what they answer, sometimes
                  their pushback, sometimes the question they ask, sometimes the topic they pivot
                  to, sometimes their own thread brought up on their own track"), and I had added
                  "sometimes a noticing about the room or another diner" as an option to make the
                  rule less coercive. That single phrase was teaching the model that
                  room-observation IS a load-bearing build-on move, and the model produced
                  evocative-noun-stack room descriptions across multiple non-poetic voices.
                </P>
                <P>
                  Fix: the "sometimes a noticing about the room or another diner" line was removed
                  from the scaffold. The remaining permission-framing options (answer, pushback,
                  question, pivot, own thread) cover the legitimate ways a character can show they
                  heard the partner without requiring an external observation seed. Voices that
                  legitimately observe the room (Cassie's brand-asset 4th-wall mode, Sera's audit
                  cadence noting venue details on the record, a documented venue-tic) still produce
                  those observations because their fixture tics carry them; voices without such a
                  tic no longer get a free pass to drift into AI-slop venue poetry.
                </P>
                <P>
                  Test impact: 555/555 tests pass after revert; the scaffold assertion in{" "}
                  <RoadmapFileRef path="app/services/date-prompts.test.ts" /> already covered the
                  revised wording from the earlier edit. The build-on rule retains its loosened
                  permission-frame ("Reply as the character would in this moment. The reply itself
                  shows you heard them"), the systemic anti-narration block, and the
                  manufactured-bridge anti-pattern ("'that's the first thing you said that I can
                  fact-check'," "'I was just thinking the same thing'"). The full scaffold rule now
                  reads as a permission-frame plus an anti-pattern list plus a positive redirect,
                  without seeding any specific build-on shape that the model will treat as a
                  required move.
                </P>
                <P>
                  Lesson: when adding options to a permission-framed rule, each option must be
                  authentic to a voice the rule is supposed to serve. An option that fits zero or
                  one voice will be over-produced by the model across all voices. The "noticing
                  about the room" option fit only documented venue-tic voices, but landed in the
                  rule as a generic permission, which the model read as a generic build-on shape.
                  Future scaffold permission options must be voice-grounded; if a behavior is
                  voice-specific, it belongs in the voice fixture, not the scaffold.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-18",
            title:
              "Alex Yoon eight-iteration lock: origin-as-character-eating tendency; debater-first state-claim foreground over single-point Kanye character; casual contraction baseline; build-on-substance vs partner-parrot",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Alex Yoon locked at v8 after eight iterations. The pass surfaced four
                  cross-cutting findings worth noting separately from the
                  personality-vs-hobby-background rule, the self-announcement antipattern fix, and
                  the scaffold revert (each documented in its own entry above).
                </P>
                <P>
                  (1) Origin-as-character-eating tendency. The v0 baseline used Allston, Boston as
                  origin and the place started absorbing the character: Boston-knower disclosures,
                  venue-poetry leak about local bars, "first-time-in-town" host energy from a
                  non-host. The user named it: "the boston thing is taking over the character, it
                  was just a small detail, literally just a reference to where he lives." Fix: move
                  origin to Torrance California with a two-years-in-Boston note. The
                  Lakers-fan-in-enemy-territory becomes the joke (he wore the jersey to Allston
                  knowing what that meant) instead of the bio. Cross-cutting application: when a
                  character's origin city is the same as the venue city, the model will treat the
                  character as a host. For voices that should NOT host the venue (which is most
                  Cupid-Transit gate-flash members), bio origin should differ from likely venue
                  city.
                </P>
                <P>
                  (2) Build-on-substance vs partner-parrot. v6 surfaced a debater-becoming-audience
                  failure mode where Alex was parroting partner phrasing as tribute ("great line,"
                  "good line," "im stealing that for review season"). The user flagged it as
                  fawning. Diagnosis: a debater character's build-on move is to engage the
                  substance, push back, take as plain truth, or call the cut by name; not to praise
                  the craft of the line. Fix: explicit register clause stating the four debater
                  responses and naming craft-praise as out of register. Cross-cutting application:
                  the build-on rule does not require positive ack; it requires engagement with the
                  content. Praise of a partner line as craft (without engaging the substance) is a
                  performative-listener move, not a character-listener move.
                </P>
                <P>
                  (3) Casual contraction baseline (Gabriel Tan precedent extended). v5 added to
                  Alex's tic 4 the same explicit contraction list as Gabriel Tan: contractions on by
                  default (im, gonna, didnt, thats, youre, doesnt, cant, wont, theres, dont, its,
                  ive, ill, wasnt, isnt). Uncontracted "I am," "I do not," "you are," "it is" only
                  fires when delivering a stake-claim absolute (i am here for the one, i am not
                  taking it back, i am calling it now, this is the one); never as default register;
                  never under partner-mirror to an archaic or ceremonial voice. Cross-cutting
                  application: every casual contemporary voice in the roster should carry an
                  explicit contraction baseline rule with the partner-mirror carve-out. Without it,
                  the model defaults to "I am" / "I do not" under any partner whose voice trends
                  formal, which flattens the casual register across the date.
                </P>
                <P>
                  (4) Curious-question move for cross-dimensional partners. v7 added a register
                  clause for how a casual contemporary voice should react to an archaic or
                  ceremonial partner: ask a plain curious question within a turn or two ("wait is
                  that an accent or something what is that," "are you doing a bit or is that you,"
                  "how do you actually talk," "no judgment im just trying to keep up"). The model
                  would otherwise either ignore the partner's voice register or partner-mirror into
                  formal vocabulary that the character would not natively use. The curious-question
                  move makes the encounter feel real: an actual contemporary person hearing a knight
                  or a fae princess would ask. Cross-cutting application: any modern human voice in
                  the roster should carry an explicit curious-question move for cross-dimensional or
                  displaced partners; the alternative is partner-mirror or silent compliance, both
                  of which are voice failures.
                </P>
                <P>
                  Pairings tested: Aldric Vale Marsh warm (supernatural), Sana Karim pressure
                  (contemporary), Eleanor Ash warm (noble), Sera Vohn warm (audit-cadence), Mei Sato
                  warm (music-identity), Marcus Pellish warm (contemporary), Anansi warm
                  (trickster). All retests after v8 read in voice. Anansi visual description
                  disambiguated during the same pass when the warm Anansi retest read his portrait
                  as three-handed: <RoadmapFileRef path="app/fixtures/members/anansi.ts" /> now
                  reads "He has four hands; three are visible in the portrait... with the fourth
                  resting at his side."
                </P>
              </>
            ),
          },
          {
            date: "2026-05-17",
            title:
              "A deflective member's bit-energy must engage with the partner's actual material or the date reads as performance-in-a-vacuum, and message length must follow one-move-per-turn or the member runs a one-man show",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Three cross-cutting voice-tuning lessons surfaced during the Gabriel Tan v3-v5
                  iterations after the casual-baseline patch landed. (1) Bit-questions must build on
                  what the partner has actually said or shown. v3 made Gabriel's questions
                  bit-shaped by default but the questions were generic new topics with no callback
                  to the partner's material (Gabriel asking about "1979 coffee" or "the cheesecake
                  factory, philosophically" while Cassie was revealing she's a Class IV powered
                  brand asset). The user flagged: "gabriel might as well be talking to a different
                  person, it's like he's not responding to anything... the conversation becomes pure
                  nonsense, it doesn't read at all, it's just gibberish." v4 fixed by requiring
                  bit-questions to weaponize the partner's specifics: a server's bottomless
                  breadsticks become "have you ever done a dramatic breadstick reenactment of a
                  famous scene", a partner who name-drops a band becomes "what would that band's HR
                  complaint sound like". Generic conversation-starter bits work only as occasional
                  pivots when a thread is genuinely dead, never as defaults.
                </P>
                <P>
                  (2) A member who is supposed to find some topic boring needs that boredom encoded
                  behaviorally, not just narratively in bio. Gabriel's bio said "the job is fine"
                  but he kept volunteering 50-word answers about his fintech work. v4 added explicit
                  behavioral text: "Asked what you do, you answer in five words (build software,
                  fintech, the usual) and pivot. You will not volunteer the company name, the team,
                  the title, the stack, or the work itself unless a partner is specifically and
                  unmistakably interested." The five-word ceiling fires reliably after this edit.
                </P>
                <P>
                  (3) Message length defaults must be explicit or the LLM stacks moves into 80-125
                  word turns. v4 had Gabriel running ack + deflect + self-disclosure + bit-question
                  + another bit + a sincere question in a single message, which read as a one-man
                  show rather than letting the conversation breathe. v5 added the rule: "messages
                  are SHORT by default. one to three sentences. one move per turn: ack OR deflect OR
                  bit-question OR share OR ask, never all of them stacked. four sentences or more
                  only fires when he's setting up a specific bit that needs the setup, when the
                  partner has clearly invited expansion, or when he's been disarmed enough to
                  deliver an actual disclosure." v5 retest dropped average turn length to ~30 words,
                  with the longer turns earned by bit-setup (worst-date story) or partner-demanded
                  sincere disclosure (the folder).
                </P>
                <P>
                  Cross-cutting application. The build-on-partner-material rule applies to any
                  member whose tic involves redirecting (bit-questions, weaponized jargon,
                  capitalized Concepts, deposition cadence). The behavioral-not-narrative rule
                  applies to any topic a member should treat as off-limits or boring (work, family,
                  an old job, a name). The one-move-per-turn rule applies to any member prone to
                  message stacking. None of the earlier-locked members need re-tune from these
                  decisions, but the rules should be referenced when authoring fixtures for position
                  19 (Sera Vohn) onward.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-17",
            title:
              "A wordplay-bearing voice needs an explicit casual baseline rule: fancy or formal words must carry joke weight or they bleed into the whole register and flatten the wordplay tic into scripted-sounding speech",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Gabriel Tan v1 looked clean on first audit (warm with Vhool, pressure with Aldric)
                  and passed verification, but on review the user flagged the voice as scripted.
                  Specific examples: "i have thought about this for approximately two seconds and i
                  am going to give you the straight answer", "you have me deep in my bag", "i would
                  like to see what flavors you keep in rotation", "i am asking for the check". The
                  wordplay tic was present and firing, but the surrounding speech was uncontracted
                  and formally constructed in places where no joke was being told. The fancy words
                  ("approximately", "constitutionally", "the mechanism", "in rotation") lost their
                  contrast and the whole register read scripted. The diagnosis: a wordplay tic only
                  reads as a tic when it sits in contrast with casual default speech; if the LLM
                  carries formal cadence outside the joke, the joke flattens into the baseline and
                  the voice sounds like a bit being performed rather than a person making jokes.
                </P>
                <P>
                  v2 patch named the principle explicitly in three places. (1) Register gained the
                  trailing clause "casual nomenclature default (fancy or formal words only ever
                  appear as the joke)". (2) Tic 1 was augmented from "wordplay baked into an
                  otherwise normal sentence (examples)" to specify that "the fancy or off-kilter
                  word IS the joke and only fires when it carries the joke. if a fancy word is not
                  pulling joke weight, it does not appear". (3) Tic 5 was augmented from "lowercase
                  i and minimal punctuation in low stakes, full stops when something lands real" to
                  add an explicit casual register baseline: "contractions on by default (i'm, gonna,
                  didn't, that's, you're, wasn't, isn't), plain nomenclature outside the joke (i
                  thought, not i have thought; like, not approximately; gonna, not going to)". Five
                  sample lines in warming, cooling, and crashingOut that leaked uncontracted
                  phrasing without carrying joke weight were rewritten to contracted casual.
                </P>
                <P>
                  v2 pressure retest with Aldric reads casual throughout while the wordplay still
                  lands at the right moments: "papercut from a sprint retrospective" (compares
                  medieval-honor questionnaire to corporate life), "it's a hoard. a small sad
                  hoard." (mock-fancy noun for a Cupid-screenshot folder), "the mechanism is trust
                  and a waitress who will absolutely find you if you try to test it" (mock-formal
                  word for "a person", paired with casual "diner physics" callback). Sincere beats
                  read fully contracted and casual ("i don't know what to say to that that isn't
                  hollow. but i hear you. and i'm still here.").
                </P>
                <P>
                  Cross-cutting lesson. This rule generalizes to any voice with a tic that uses a
                  distinctive lexical or syntactic move (wordplay, archaic vocabulary, weaponized
                  jargon, mock-formality). The tic only reads as a tic if the surrounding speech
                  carries the OPPOSITE register. The fixture must name this contrast explicitly or
                  the LLM defaults to carrying tic-shaped vocabulary across the whole register.
                  Spot-check candidates: members whose voice blocks describe a distinctive lexical
                  move without naming a casual or plain baseline contrast. From the locked roster:
                  Marcus Pellish (deposition cadence is already paired with HVAC-specifics
                  contrast), Calvin Hewes (mediator-jargon is already paired with cryptid-in-denial
                  mundane explanations contrast), Cassie Conners (Comms vocabulary is already paired
                  with off-record-relay casual contrast). None of these need re-tune. Future members
                  with a lexical-distinctive tic should write the casual baseline rule into the
                  fixture from the start.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-17",
            title:
              "Add a social-mismatch reaction rule to the character prompt so focus members notice repeated mis-addressing, misread profession, or misaligned-lifestyle framings instead of letting them entrench in the thread history",
            outcome: "accepted",
            body: (
              <>
                <P>
                  The user flagged during the Calvin lock cycle that Aldric Vale Marsh kept
                  addressing male-presenting partners (including Calvin Hewes) as "M'Lady" across
                  multiple turns, and the focus members never commented on it. Investigation
                  surfaced two contributing causes. (1) Aldric's fixture sample bank was
                  M'Lady-biased: three of four greeting samples opened with M'Lady, and his tic
                  ("opens with M'Lady or Good Stranger") listed M'Lady first without coaching the
                  LLM on when each fires. (2) The character prompt scaffold in{" "}
                  <RoadmapFileRef path="app/services/date-prompts.ts" /> rules block had explicit
                  reaction rules for novel-claim acknowledgment ("Silence here reads as scripted
                  disinterest") and dealbreaker crossing ("drop charm. Show the line plainly. If
                  they keep crossing it, leave"), but NO rule for persistent social mismatches that
                  aren't dealbreaker-level: wrong honorific, wrong pronoun, misread profession,
                  misheard name, misaligned lifestyle assumption. The LLM had no prompt-level signal
                  that repeated mis-addressing should accumulate into a reaction.
                </P>
                <P>
                  Two fixes landed in one pass. The prompt scaffold gained one rule between the
                  novel-claim and build-on-earlier-moments rules:{" "}
                  <em>
                    "If [partner] addresses you with an honorific, pronoun, or assumption that does
                    not fit you (a misgendered title, a misread profession, a misheard name, a wrong
                    lifestyle assumption), let it slide once. By the second or third instance, react
                    in your own register: a correction, a flat note, a dry redirect, or an
                    acknowledgment that the framing does not fit. Silence reads as agreement and the
                    mismatch entrenches as fact in the thread history."
                  </em>{" "}
                  Aldric's fixture rebalanced: the M'Lady-or-Good-Stranger tic was rewritten to
                  specify that Good Stranger is the default for unknown or male-presenting partners
                  with M'Lady reserved for partners reading clearly as a Lady, plus an explicit
                  instruction to switch to the partner's preferred form of address after any
                  correction and not return to the prior form. Greeting bucket rebalanced to three
                  Good-Stranger openers and one M'Lady opener (down from three M'Lady openers and
                  one Good-Stranger opener); the lone M'Lady hingeBits opener swapped to Good
                  Stranger.
                </P>
                <P>
                  This is a SYSTEMIC change to the character prompt and affects every member tuned
                  before this point. The new rule asks focus members to react to repeated social
                  mismatches, which earlier tunes did not exercise because the prompt did not ask.
                  Earlier-locked members are flagged for spot-check: Jenna Pike, Vhool, Sienna Bae,
                  Kade Sumner, Mr Whiskers, Opal Sunday, Venus, Anansi, Gideon Glass, Meridian Vale,
                  Aldric Vale Marsh, Sana Karim, Imani Wallace, Epsy, Marcus Pellish, Cassie
                  Conners, Calvin Hewes, Idris Mahari. The expected behavior delta is small: members
                  whose fixtures already produce strong in-character reactions to misreads (Vhool,
                  Marcus, Calvin) will read similarly with one additional gentle-correction beat by
                  turn 2-3 of any mismatched session; members with softer registers may pick up a
                  flat-note correction where they previously stayed silent. No retunes scheduled by
                  default; spot-check happens on re-encounter when a future session naturally lands
                  a mismatch surface.
                </P>
                <P>
                  Cross-cutting lessons. (1) Reactive-acknowledgment rules in the character prompt
                  need to cover three distinct categories: novel claims (powers, supernatural,
                  displacement), dealbreaker violations, and social mismatches. Each category has
                  its own escalation curve and the prompt should name each explicitly. (2) Fixture
                  sample banks with binary-choice tics ("opens with X or Y") must model both options
                  across the sample bucket AND specify when each fires; otherwise the LLM defaults
                  to whichever option is listed first. (3) Systemic prompt fixes should be applied
                  without retunes by default, with spot-check happening on re-encounter rather than
                  scheduled. The cost of retuning every locked member exceeds the value of
                  pre-emptively validating an expected-small delta.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-17",
            title:
              "A visibly non-human member needs voice surface for what they are, not just what they cover, plus a comedy archetype and hobbies that give them language outside their cover register",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Calvin Hewes locked at v5 after five fixture iterations. v1 reads as a paranoid
                  corporate-mediator with a quirky cryptid backstory, not as a moth-cryptid
                  pretending to be human. The voice block surfaced only the cover (corporate cagey,
                  going-forward connectors, capitalized Bridge Incident, retained counsel) with zero
                  voice surface for the creature underneath. Bio established Mothman; voice
                  established mediation pro; the gap between them stayed silent in generation. Both
                  the warm baseline (Aldric) and the pressure baseline (Kade) produced
                  generic-warm-mediator turns with poetic-literary drift and partner-mirror
                  domesticity in the warm-context portions of the pressure session. The user named
                  the failure correctly: "robot, not cryptid pretending to be human."
                </P>
                <P>
                  v2 layered a Bojack Horseman comedy engine with
                  Counsel-as-a-colleague-with-a-difficult-week,
                  Tailor-in-Charleston-as-saint-of-discretion, weaponized mediator-speak on absurd
                  cryptid-life problems, cryptid-petty grievance, and sensory leakage. The engine
                  landed funny and the cover held under both warming and pressure, but
                  Counsel-as-a-character pulled the bit toward "paranoid manager with an imaginary
                  lawyer-pal" rather than "cryptid pretending to be human." The Tailor-as-saint
                  frame extended a one-line bio detail into a recurring hagiographic gag the
                  cryptid-in-denial bit did not need. The user's diagnosis: drop
                  Counsel-as-character and Tailor-saint, "rewrite his whole persona to fit the
                  cryptid in denial with bojack voice better."
                </P>
                <P>
                  v3 reframed the bit around COLLABORATIVE DENIAL: Calvin is visibly a moth-cryptid,
                  his date can see he is a moth-cryptid, and they BOTH play along with the fiction
                  that he is Calvin Hewes from Point Pleasant. The denial is collaborative; the
                  cover is co-maintained. Calvin's job is to make the denial easy for his date
                  through mediator cadence and deadpan deflection. Three new running gags: (a)
                  deadpan mundane explanations for moth-coded visible features ("the antennae are
                  decorative," "the fur is a tailoring choice"), (b) cryptid-petty differentiation
                  ("I am not the Jersey Devil. The Mothman in Manitoba is unrelated. We are not in a
                  series"), (c) moth-coded life inconveniences in mediator-speak. Counsel reverted
                  to a real legal deniability phrase only; Tailor-saint disappeared. v3 pressure
                  session locked clean: "The antennae are decorative" fired direct-on-prompt when
                  Kade asked, "I would like the record to show I am prepared to pivot to pancakes"
                  landed as peak cryptid-in-denial-Bojack. v3 warm session held cover overall but
                  Aldric's ceremonial-vulnerability register (the wreath as half-paid Bargain, the
                  writ, the chapel) triggered a NEW drift mode: Calvin invented a drawer-token (a
                  drawing of a moth in ink with "a signature underneath... a name I have not used in
                  the open air"), described the proboscis as a coil-able object he had private
                  access to, and produced "version of me that has not yet been sworn to anything"
                  introspection. The cover effectively cracked under partner-induced
                  vulnerability-mirroring even though the cooling bank held under direct probes.
                </P>
                <P>
                  v4 added two things in concert. First, two hobbies (film and television nerd
                  through approximately the spring of 2002 with a specific reference catalog: The
                  Wire pilot, Sopranos S1-3, Six Feet Under S1, Twin Peaks, X-Files, Larry Sanders,
                  Heat, Miller's Crossing, Out of the Past, Double Indemnity, The Insider, Rushmore,
                  Royal Tenenbaums, Wings the 1990 sitcom; and the NYT Sunday crossword in pen with
                  documented opinions about Will Shortz). The hobbies give Calvin language OUTSIDE
                  of mediation jargon and produce "outside my current review" deflection on any
                  post-2002 reference as its own running gag. Second, drift bracing in FORBIDDEN
                  CONSTRUCTIONS: no past-life artifacts (no drawer-tokens, no letters from years
                  past, no mementos, no objects "brought tonight in case the booth aligned"), no
                  true-name or unspoken-name references, no "version of me" or "former self"
                  introspection, no deep-describing moth biology beyond brief mundane deflection. v4
                  pressure session locked clean: Heat reference fired as procedural analogy for menu
                  strategy ("the discipline carries over"), "outside my current review" fired twice
                  with phrasing variance on Renee Rapp and TikTok, "I have been Calvin Hewes for
                  forty-seven years. The date is holding because I am holding it" closed the session
                  as the thesis line. v4 warm session FIXED the v3 drifts (no drawer-token, no
                  true-name, no version-of-me) and produced the cleanest bureaucratic-vulnerability
                  reciprocation in the run when Aldric offered the wreath/writ/chapel: "I carry a
                  Folder. It lives on the passenger seat of a car I do not drive across certain
                  bridges. I update it on Thursdays. It is not a romance. It is due diligence. The
                  weight at my belt takes the form of a sealed envelope from counsel that I have not
                  read in three years and a form from the Region that lists me as six foot two." But
                  one residual drift remained: "The proboscis does not extend in mixed company. It
                  is a matter of decorum, not pathology" surfaced again. The line was traceable to a
                  fixture register-block example that the FORBIDDEN CONSTRUCTIONS section later
                  flagged as bio-disclosure; the fixture contradicted itself.
                </P>
                <P>
                  v5 micro-patch resolved the self-contradiction: the register-block example swapped
                  from "The proboscis does not extend in mixed company. It is a matter of decorum,
                  not pathology" to "I do not have a proboscis. This was not asked" (denial-shape,
                  denies the biology in the form he is wearing rather than describing when it does
                  or does not surface), and the FORBIDDEN CONSTRUCTIONS list added "does not extend
                  in mixed company" and the "decorum, not pathology" follow-up as explicit wrong
                  examples. No retest needed; the swap is mechanically correct.
                </P>
                <P>
                  Cross-cutting lessons for the rest of the roster. (1) Visibly non-human members
                  need voice surface for what they ARE, not just what their cover IS. The bio
                  establishes the species; the voice block must surface the gap between the species
                  and the cover. Without that surface the LLM generates the cover only and the
                  character reads as a paranoid human with a quirky backstory rather than as a
                  creature pretending to be a person. The surface for Calvin took the form of
                  deadpan mundane explanations for visible features, cryptid-petty differentiation
                  from other cryptids, and unselfconscious sensory leakage in mediator cadence.
                  Other visibly non-human members (Mr Whiskers, Reaver, the full non-human cluster)
                  should be spot-checked on re-encounter to verify their voice blocks carry
                  creature-surface, not just cover-surface. (2) A named comedy archetype anchors the
                  LLM more than any frequency-promise on its own. Marcus used Northernlion. Epsy
                  used Anya-doing-Ilana. Calvin uses Bojack Horseman. The archetype should be NAMED
                  in register and SPECIFIC to a voice the LLM has prior knowledge of; "Bojack-coded
                  melancholy" is enough to anchor the comedic delivery pattern (deadpan absurdity,
                  weaponized vocabulary, petty grievance, self-aware-not-introspective). (3) Hobbies
                  and reference catalogs are more than character color: they give the LLM language
                  OUTSIDE the cover register. A pre-2002 film-and-television catalog gave Calvin
                  analogies for restaurant-meeting protocol (Heat), plausible deniability (Out of
                  the Past), ethics-in-mediation (Miller's Crossing), and deposition voice (Larry
                  Sanders) without requiring autobiographical disclosure. A specific cutoff date
                  (spring 2002 for Calvin) doubles as a running gag through "outside my current
                  review" non-engagement on anything newer. (4) The collaborative-denial framing
                  solves a specific failure mode: when a character's visible features are obviously
                  non-human, the LLM defaults either to (a) full cover-and-pretend-nothing-is-wrong
                  (boring, no acknowledgment of the gap) or (b) confessional-acknowledgment (breaks
                  the cover). Collaborative denial puts the gap into the FOUR-DIMENSIONAL space the
                  LLM understands: both characters see the gap, both agree to not name it, and the
                  comedy lives in deadpan explanations and partner-incurious-reactions. (5)
                  Partner-induced introspection is a distinct failure mode from partner-induced
                  domestic-mirroring; both need explicit forbidden constructions. The Marcus lesson
                  on domestic-mirroring ("does not mirror partner's laundry-photo or mom moment")
                  generalized cleanly, but Aldric's ceremonial-vulnerability register triggered a
                  NEW mirror mode where the LLM produced invented past-life artifacts
                  (drawer-tokens, letters, unspoken names). The fixture brace needs to list
                  past-life artifacts and true-name references as forbidden explicitly; the
                  introspection ban alone is not enough because the LLM does not read "I have kept a
                  letter in a drawer since 2016" as introspective. (6) When a fixture register-block
                  example contradicts a fixture FORBIDDEN CONSTRUCTIONS rule, the LLM follows the
                  example. Self-consistency audit on the fixture is part of every patch: any example
                  in register that violates a forbidden-construction rule must be rewritten, not
                  just flagged. The proboscis-as-coilable-object drift was a fixture
                  self-contradiction, not a generation failure.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-17",
            title:
              "When a wound is synonymous with the bit, the fix is structural: remove the wound and externalize the protective force as a live in-fiction constraint",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Cassie Conners locked at v5 after a structural rewrite that replaced her former
                  wound ("the brand ate the real voice, she no longer knows which is hers") with a
                  wound-free framing in which she is simply tired of being a public-facing corporate
                  brand asset and trying to find out what an unmediated date sounds like. The prior
                  auditer's v3 pass landed eleven issues, eight of which were fixture-level fixable.
                  The remaining structural issue (#2 bit-naming collapse: when partners pried
                  sincerely on "why the voice," Cassie's LLM kept producing plain-speech wound
                  monologues like "the brand ate me" or "I do not know which one is mine") could not
                  be fixed by tightening forbidden-token lists across three rounds because Cassie's
                  wound was synonymous with her bit. The sincere answer to "why the bit" was the
                  wound, and the LLM could not deflect within the voice without delivering the wound
                  on a plate.
                </P>
                <P>
                  Marcus Pellish's grief drives his deposition voice without being it; Epsy's
                  substrate-civilization drives her it-girl lex without being it. Both have wounds
                  CONNECTED to their bits, not synonymous, so their bits can function as defenses
                  against revealing the wound. Cassie's old fixture lacked that distinction; the bit
                  and the wound were the same thing.
                </P>
                <P>
                  The chosen fix removed the wound entirely. The protective force (formerly
                  internal: "I do not know which voice is mine") was externalized as a live
                  in-fiction constraint: the Helios Comms desk reaches Cassie in real time through
                  an earpiece that is "signal-locked on paper" but functional in practice. Her ear
                  is full of brand-alignment notes during every date, and the bit is now the
                  per-turn negotiation between her honesty and the desk's reach. The premise the
                  user named: "someone genuine but hiding something, she can never go too honest or
                  Comms pulls her back." This gives the LLM a concrete external agent to deflect to
                  ("Comms wants me to redirect, I am redirecting") instead of an internal wound to
                  reveal. The category-B failure mode dissolved because "why the bit" no longer has
                  a wound for an answer; the answer is "the company is in my ear" and points
                  outward.
                </P>
                <P>
                  Cassie's Renata-aloud tic (the most distinctive on the v3 fixture) was retired
                  with the wound. Renata as named handler is gone; the desk is faceless and
                  rotating. The fifth tic slot now houses the Comms interruption directly. The
                  earpiece artifact and the "calling it a prop" dealbreaker survive as Helios
                  hardware, with no personal-handler weight.
                </P>
                <P>
                  v4 baseline ran Imani Wallace (warm) and Kade Sumner (boundary-pressure). The Kade
                  pressure session ran Comms in 4 of 6 turns with the canonical slip-harder template
                  fired nearly verbatim on the next-chapter pry; the Hopewell Wabash-bridge closer
                  landed cleanly after Kade's self-correction. Imani's warm session had scene
                  quality high (Hopewell mom move, "Dawn Reach" naming, the two-conversations
                  metaphor mirrored by Imani's reaper paperwork) but Comms fired only once across
                  seven Cassie turns, below the v4 floor of two in six+. Diagnosis: the v4 trigger
                  list was topic-keyed (work, powers, dimension, messaging) and Imani's warm
                  questions were personhood-focused, so the LLM had no triggers in conservative
                  mode.
                </P>
                <P>
                  v5 patches tightened the floor from two of six to three of six; added tone-fire
                  triggers so Comms can fire on cadence rather than topic ("the desk wants me to
                  remember the brand cadence," "Comms just clocked that I have not said DAYBREAK in
                  twenty minutes"); added broader trigger surfaces (Cassie volunteering personal
                  info Helios would not put on a billboard; Cassie agreeing with a partner
                  observation Helios would consider off-brand; two consecutive real-name-mode turns
                  fires the desk on the third); and added the framing "the desk is omnipresent and
                  selective only in WHEN it fires, not WHETHER." The v5 warm retest with Imani ran
                  Comms 5 of 7 turns with the new tone-fire triggers all landing ("Comms is, on the
                  record, sending a note about that last sentence"; "Comms wants me to tell you that
                  was a very 'relatable' answer and I am, on the record, not going to relay that";
                  "Comms wants me to say something about tomorrow's schedule. I'm not going to say
                  it."). Scene quality high; on-record/off-record bracketing fired in 4 of 5 Comms
                  turns and reads as the seam-comedy working rather than as a schedule. Soft watch:
                  if a future session pushes the bracketing to 6 of 6, consider adding two
                  Comms-without-bracketing samples to vary the shape.
                </P>
                <P>
                  Cross-cutting lessons for the rest of the roster. (1) When a member's wound is
                  synonymous with their bit, prefer a structural rewrite over further fixture
                  hardening; three rounds of forbidden-token lists will hit the same gradient if the
                  bit and wound are the same thing. The fix is either to reposition the wound so the
                  bit becomes a defense (Marcus, Epsy shape), or to remove the wound entirely and
                  externalize the protective force as a live in-fiction constraint (Cassie shape).
                  (2) Externalized constraints give the LLM a deflectable concrete agent ("Comms
                  wants me to redirect") instead of forcing the wound to be the surface answer; the
                  external agent also gives the partner a visible handle to play. (3) Frequency
                  floors alone do not push topic-keyed tics into off-topic sessions; combine floor
                  with broader triggers (tone-fire, personal-info reveal, agreement-with-partner,
                  real-name-streak) and positive examples for the LLM to anchor to. The Marcus
                  precedent on hard-token lists generalizes: narrowing the LLM's options is more
                  reliable than describing the desired posture. (4) Warm and pressure sessions
                  stress different failure modes: warm tests whether the bit fires when the partner
                  gives the character room, pressure tests escalation. Both are required to lock a
                  member with a topic-keyed bit, and the asymmetry between them is often diagnostic
                  rather than a bug. (5) Members previously locked whose wounds risk synonymy with
                  their bits should be spot-checked on re-encounter; Venus's verdict-delivery voice
                  is close to her wound and worth a re-audit if a future transcript shows
                  wound-leakage under stress.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-17",
            title:
              "Voice tuning needs four lever types in concert: comedy archetype, tic frequency promises, hard pressure-hold rules in register, and hyper-specific minutiae over generics",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Marcus Pellish locked after four fixture iterations because each round fixed the
                  prior catastrophe and exposed a softer regression that the next round had to
                  target. v1 was a full Northernlion rewrite that applied only the Epsy lessons
                  (comedy archetype in register, tics name the joke). Result: tic starvation
                  (humble-narrator 1/16 turns, hypothetical framing 0/16) and total bit-dissolution
                  on bit-naming pry. Diagnosis: the fixture described what Marcus <em>can</em> do
                  and the LLM read it as what Marcus <em>might</em> do. v2 added explicit frequency
                  promises to each tic ("fires every turn, no exceptions" / "escalates under
                  pressure") plus a hard pressure-hold rule in <DocCode>register</DocCode> stating
                  the bit never drops when called out. Result: tic frequencies leapt (hypothetical
                  0→5/7 warm, humble-narrator 1→5/7 with doubled deflection at the bit-naming turn),
                  bit-dissolution fixed, swear-dealbreaker fired clean. New problem: every turn
                  became a 100+ word monologue. The gulf-formality-triviality joke needs the cadence
                  to punctuate, not flood.
                </P>
                <P>
                  v3 added a length variety rule, short-cadence sample messages ("Noted." "Filed."
                  "Concur." "I would push back on that.") in every bucket, and an origin opacity
                  principle ("never volunteers the origin window even inside the voice"). Result:
                  warm length distribution recovered (1 short / 4 medium / 1 aria across 7 turns)
                  and the warm bit-name + origin-pry hit the canonical "have not fully turned over"
                  deflection. But the pressure session stacked three arias at T5/T6/T7 (105/132/119
                  words) and under sincere ceremonial pry the LLM volunteered the exact forbidden
                  origin window ("before the divorce and before the Carrier Infinity twenty-six
                  warranty rollout in 2018") dressed in deposition voice. Principle-based opacity
                  was not enough; the LLM kept producing some version of "voice started after X"
                  because vulnerability is a strong dating-context prior.
                </P>
                <P>
                  v4 tightened the length rule from three to two adjacent arias and added a
                  partner-reciprocation rule ("if the partner sent under 20 words, Marcus
                  reciprocates with under 40"); replaced the origin opacity principle with a
                  hard-token list ("NEVER cites specific years (2017, 2018, 2019), NEVER pairs the
                  divorce with the voice as cause-and-effect, NEVER mentions the Carrier rollout in
                  connection with the voice"); added a specificity-is-the-comedy rule that
                  enumerates forbidden generic phrases verbatim ("the mortgage is within reason," "I
                  am not a rich man," "I have opinions about refrigerant transitions") and demands
                  named exits, specific towns, customer surnames, and weird route details; and
                  strengthened the HVAC stat tic so every fire must include brand+model +
                  customer/town + weird customer detail. Result: origin opacity decisively fixed
                  under the same pressure phrasing that broke v3 (canonical fallback verbatim, zero
                  forbidden tokens, surgical pivot to coffee). The funniest moments of the entire
                  pass arrived in v4: the union groundhog line (warm T3), the Shelby water line
                  (pressure T4 "I do not know what the water is doing in Shelby but it appears to be
                  depositing something"), the butter distribution line (warm T8). Two soft
                  regressions remained and were accepted: one back-to-back aria stack at pressure
                  T6/T7, and one fire of two named-forbidden generic phrases at pressure T7. Both
                  are LLM-gradient-shaped, not fixture-shaped; further tightening hit diminishing
                  returns.
                </P>
                <P>
                  Cross-cutting lessons for the rest of the roster. (1) Comedy archetype named in{" "}
                  <DocCode>register</DocCode> is the cheapest lever and worked on both Epsy
                  (Anya-doing-Ilana) and Marcus (Northernlion); for engine-driven characters, try
                  this before stacking more tics. (2) Tics as frequency promises ("drops at least
                  once per session") beat tics as capabilities ("tends to drop"); the LLM treats
                  capabilities as optional. (3) Hard rules in <DocCode>register</DocCode> beat
                  principles in <DocCode>bio</DocCode>; the LLM weights register text more for
                  behavior, bio for backstory. (4) Hard-token avoidance lists ("never use the words
                  '2017,' '2018,' 'before the divorce' in any response about the voice") beat
                  principle-based opacity rules; narrowing the LLM's escape hatches is more reliable
                  than describing the desired posture. (5) Length variety needs three things
                  together: an explicit anti-pattern (run-of-N-arias), short-cadence sample messages
                  in every bucket, and a partner-reciprocation rule; any one alone leaves the LLM
                  free to default to verbose. (6) Specificity-is-the-comedy needs forbidden generic
                  phrases listed verbatim in <DocCode>register</DocCode>; even then it is not
                  absolute (Marcus T7 still fired "the mortgage is within reason"), so plan for one
                  iteration of leakage. (7) Partner selection matters for verbose-bit characters:
                  clipped partners (Sana) enable register drift by inviting matching; engaged-asker
                  partners (Imani) give room for the bit to fire. Warm sessions for verbose
                  performers should prefer the latter.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-17",
            title:
              "Tics must name the joke they set up, not the mannerism they produce, and a comedy archetype in register anchors the LLM",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Epsy's baseline ran the fixture's existing tics correctly (lex armor, hobby
                  triplets, ONE-word caps) but the transcripts read as a mystery being revealed
                  rather than as comedy. The fixture in{" "}
                  <RoadmapFileRef path="app/fixtures/members/epsy.ts" /> was describing MANNERISMS
                  ("lists hobbies in triplets that include exactly one nonsense item") without
                  naming what JOKE each mannerism sets up, and the LLM dutifully produced
                  mannerisms-without-punchlines. The v2 revision rewrote each tic to name the comic
                  engine: the triplet is "the setup, the nonsense item is the punchline"; the
                  apocalypse drop is "the flat delivery is the joke, flinching at her own content
                  kills it"; the lex is "the joke is the lex applied to apocalyptic content
                  ('LITERALLY ended my civilization'), not the lex by itself." The warm retest then
                  produced visible setup-payoff structure (turn 7 triplet setup, turn 9 reveal "the
                  fake was record stores. i have never been to one. i just like the word.") that the
                  baseline never landed. Future fixtures should grade each tic by whether it names a
                  joke, not just a behavior.
                </P>
                <P>
                  Anchoring the comedy with a single character reference in{" "}
                  <DocCode>register</DocCode> also worked. Adding "Comedy register is Anya Jenkins
                  (apocalyptic content at small-talk volume, exceedingly literal,
                  normal-human-rituals-she-does-not-need) doing an Ilana Wexler impression (Brooklyn
                  it-girl babe/OBSESSED/ily lex)" gave the LLM one concrete model to instantiate
                  against, and the post-revision transcripts immediately read closer to that target.
                  For future members whose comedy is engine-driven rather than just voice-driven,
                  naming a single archetype (or a small composite like "X doing a Y impression") in
                  register is worth trying before stacking more tics.
                </P>
                <P>
                  One limit: the revised tic 4 says "the armor escalates when the room goes quiet,
                  never retracts," and the LLM did not honor that against Marcus Pellish's quiet
                  sincere pressure, the xoxo/babe/caps still receded on turns 03, 11, and 13 of the
                  pressure retest. Fixture text alone could not override the model's
                  register-matching prior for a partner with very quiet steady warmth. Accepted as a
                  partial win; future audits with the same failure mode should try moving
                  pressure-hold rules into <DocCode>register</DocCode> directly and adding sample
                  messages that explicitly demonstrate armor escalation in front of a quiet partner,
                  rather than relying on tic-text alone.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-17",
            title:
              "Inward-only tic stacks read as a slog, and named offstage characters get comedy-mined",
            outcome: "accepted",
            body: (
              <>
                <P>
                  Two findings from the Sana Karim pass. Her v3 warm baseline read as a slog despite
                  passing canon and voice checks because all five tics and three patternsUsed in{" "}
                  <RoadmapFileRef path="app/fixtures/members/sana-karim.ts" /> were inward (body,
                  job, exhaustion), with nothing turning her attention outward. Two tired characters
                  commiserating without any external observation produced flat warm dialog. The v5
                  fixture added "lands flat observations about the venue, the date ritual, or other
                  diners" as a tic and the warm opener immediately gained texture ("The jukebox
                  tab's still in the wrapper. That's a level of hope I respect."). Future audits
                  should treat purely-inward tic stacks as a slog risk and add an observational
                  counterpart before locking.
                </P>
                <P>
                  Separately, the original fixture named a specific student ("Mason") as a unit of
                  suffering and the partner-play AI grabbed the name as a recurring sitcom character
                  ("what's mason doing right now you think") as if both characters shared knowledge
                  of the kid. The v5 fixture removed the name and uses "the kid in my class who
                  can't sit" with the bio bridge "You've stopped saying his name out loud because
                  saying it feels like agreeing"; the comedy-mining stopped on the next retest. For
                  future fixtures, recurring offstage characters whose role is "unit of suffering"
                  should be unnamed. Named offstage characters are appropriate only when the partner
                  could legitimately ask about them as a shared topic.
                </P>
              </>
            ),
          },
          {
            date: "2026-05-17",
            title: "Focus member opens tune sessions so the greeting bank fires naturally",
            outcome: "accepted",
            body: (
              <P>
                During the Aldric Vale Marsh baseline the user clarified that the focus member
                should open the tune date so the greeting bank fires in isolation, not as a reply to
                a partner opener. The CLI flag <DocCode>--focus-opens</DocCode> on{" "}
                <DocCode>tune start</DocCode> makes the focus member speak first; subagents must
                include it on every <DocCode>tune start</DocCode> call. After start, the next
                command is <DocCode>tune turn --session &lt;name&gt;</DocCode> to generate the
                focus's opener, then alternating <DocCode>say</DocCode> calls. Canon-protection
                discipline shifts to the partner's first speaking turn (their reply to the focus's
                greeting), which still becomes load-bearing context for the focus's subsequent turns
                and must not credit the focus for venue, time, route, or match. Members tuned before
                this change (positions 1 through 11) had their greetings tested as reply-shaped
                first turns rather than as openers; spot-check on re-encounter if a greeting bank
                seems untested in voice.
              </P>
            ),
          },
          {
            date: "2026-05-17",
            title: "Transcript windows must be contiguous, not cherry-picked highlights",
            outcome: "accepted",
            body: (
              <P>
                During the Meridian Vale lock the user clarified that the readable transcript window
                surfaced for each baseline and final-lock test must show turns in the order they
                happened as a continuous stretch, not non-adjacent picks stitched together with
                ellipses. A cherry-picked highlight reel reads as evidence for an opinion rather
                than as a scene, and the user is looking at the conversation as a conversation. The
                "up to six focus-member turns per pairing" cap stays as a transcript-economy rule;
                within that cap, the window is a contiguous span (typically the most informative
                unbroken stretch of the actual session) plus the partner lines that prompted those
                focus turns. If a session ran six or fewer focus turns, surface the whole session.
              </P>
            ),
          },
          {
            date: "2026-05-17",
            title: "Make entertainment and readable transcript windows the lock bar",
            outcome: "accepted",
            body: (
              <P>
                The audit now treats character interaction quality as the product gate. A member is
                not locked merely because the transcript avoids canon leaks, prompt artifacts, or
                caricature. The scene has to be interesting, funny, and worth reading, with each
                line giving the other member something alive to answer. Transcript surfacing also
                moves from full-session dumps to a readable window: up to six focus-member turns per
                pairing plus the partner lines that prompted them for every baseline and final-lock
                test, with retest excerpts shown only around the failure unless the user asks for
                the full transcript.
              </P>
            ),
          },
          {
            date: "2026-05-17",
            title: "Replace forced crash-out with boundary pressure",
            outcome: "accepted",
            body: (
              <P>
                The second pairing in each member pass now tests boundary pressure instead of
                forcing an early ending. Dealbreakers, guards, and private pressure should surface
                when the scene earns them; a clean cool-down, refusal, redirect, or dignified
                walkout can all pass. Cupid pressure in tune sessions remains useful for exposing
                cooling and crashingOut samples, but Date Health should follow transcript evidence
                rather than serving as a rail toward collapse.
              </P>
            ),
          },
          {
            date: "2026-05-17",
            title: "Keep prompt research proportional",
            outcome: "accepted",
            body: (
              <P>
                Routine fixture tuning now reads the local prompt contract in{" "}
                <DocLink to="/docs/product/voice-prompts">Voice prompts</DocLink>. The external
                prompt engineering references stay in this roadmap for systemic prompt rewrites,
                where the extra context is worth the overhead. This keeps the pass focused on live
                scene quality instead of turning every fixture edit into a prompt-research task.
              </P>
            ),
          },
          {
            date: "2026-05-16",
            title: "Walk the curated roster order, not alphabetical",
            outcome: "accepted",
            body: (
              <P>
                The onboarding screen and roster canvas show members in the curated order defined by{" "}
                <DocCode>CURATED_MEMBER_ROSTER_ORDER</DocCode>. Auditing in that same order means
                the first six tuned members are the same six a new player sees first.
              </P>
            ),
          },
          {
            date: "2026-05-16",
            title: "Track out-of-order tunes on the same checklist",
            outcome: "accepted",
            body: (
              <P>
                Gideon (position 9), Imani (position 13), and Idris (position 39) were tuned before
                the cursor reached them. Rather than fork the list, the checklist marks them done in
                place with a short note, so the queue still reads top to bottom and nothing is
                skipped silently.
              </P>
            ),
          },
          {
            date: "2026-05-16",
            title: "Promote systemic prompt changes to the decisions log",
            outcome: "accepted",
            body: (
              <P>
                During the Idris pass the Cupid Transit and Cupid Connect entry mechanic was added
                to <RoadmapFileRef path="app/services/date-prompts.ts" />, together with a tag-based
                acclimation calibrator and a full positive-framing rewrite of prescriptive rules.
                Members tuned before that change (positions 1 to 6) honored the old scaffold; if a
                future spot-check shows their voice drifted, re-tune those entries and re-lock.
              </P>
            ),
          },
          {
            date: "2026-05-16",
            title: "Patch sanitizer to strip ASCII dash breaks",
            outcome: "accepted",
            body: (
              <P>
                During the Imani pass the focus member produced <DocCode>" -- "</DocCode> as a
                clause break, which CLAUDE.md and the voice tuning memory both ban.{" "}
                <RoadmapFileRef path="app/services/player-safe-copy.ts" /> only stripped unicode em
                and en dashes. The strip now also collapses ASCII <DocCode>--</DocCode> and space
                hyphen space patterns when used as breaks, while preserving hyphenated compounds and
                numeric ranges. Three new cases land in{" "}
                <RoadmapFileRef path="app/services/player-safe-copy.test.ts" />.
              </P>
            ),
          },
          {
            date: "2026-05-16",
            title: "Add anti-mirror clause to the profile rule",
            outcome: "accepted",
            body: (
              <P>
                During the Imani pass the focus member echoed the partner's profile criteria back as
                self-description (Alex's profile asked for someone who can sit through a sports
                debate and defend an opinion, and Imani's reply contained both phrases
                near-verbatim). The profile rule in{" "}
                <RoadmapFileRef path="app/services/date-prompts.ts" /> now adds a positive-framed
                clause: self-descriptions sound like you, not like a mirror of the partner's listed
                qualities. Members tuned before this change (positions 1 to 6, 9, 39) honored the
                old scaffold; spot-check on re-encounter.
              </P>
            ),
          },
          {
            date: "2026-05-16",
            title: "Establish Cupid as the venue and match picker",
            outcome: "accepted",
            body: (
              <P>
                During the Imani pass the partner-played opener referenced "you picked the diner,"
                which the focus member accepted as canon. The IDC premise is closer to a brokered
                blind date: the dating coach pairs the members and Cupid picks the venue and the
                time. The scene block in <RoadmapFileRef path="app/services/date-prompts.ts" /> now
                states this explicitly so neither member credits the other for the location. Members
                tuned before this change (positions 1 to 6, 9, 13, 39) honored the older scaffold
                that left venue agency ambiguous; spot-check on re-encounter, and watch for fixture
                dating profiles that claim "I pick the spot" since that personality trait still
                exists outside Cupid but does not apply inside a Cupid date.
              </P>
            ),
          },
          {
            date: "2026-05-17",
            title: "Require fenced-code transcripts during the audit cycle",
            outcome: "accepted",
            body: (
              <P>
                During the Venus pass the user asked to see every subagent-produced transcript
                verbatim alongside any analysis, parsed into readable per-line sections. The
                per-member procedure now requires every transcript (including retests after fixture
                fixes) to be surfaced in fenced code blocks with each line numbered and labeled by
                speaker first name in turn order, with the subagent observation note following the
                transcript rather than replacing it.
              </P>
            ),
          },
          {
            date: "2026-05-17",
            title: "Promote partner-play venue canon to the procedure",
            outcome: "accepted",
            body: (
              <P>
                During the Venus warm v3 retest the Anubis partner-play opener said "you picked the
                diner," which Venus correctly rejected in turn 2 ("I did not pick the diner. Cupid
                picked the diner.") but the false attribution still biased the first half of the
                date. The earlier 2026-05-16 prompt-scaffold fix made Cupid the venue picker inside{" "}
                <RoadmapFileRef path="app/services/date-prompts.ts" />; the corresponding
                partner-play discipline now lives in the spawn-subagents bullet in the per-member
                procedure. Subagent prompts must instruct the partner-play opening line to stay
                venue-neutral or Cupid-attributed regardless of what the partner's own fixture
                personality says about picking restaurants.
              </P>
            ),
          },
          {
            date: "2026-05-17",
            title:
              "Strip `that is X` from Venus's count tic and ship as accepted character signature",
            outcome: "accepted",
            body: (
              <P>
                During the Venus pass the model over-extended the compliment-count tic ("that is
                one, that is two") into a generic verdict pointer that fired heavily under stress
                and produced "X. And you Y. That is Z." setup-then-verdict chains. The count tic in{" "}
                <RoadmapFileRef path="app/fixtures/members/venus.ts" /> now uses bare numerals
                ("one, two, three"), the two hingeBits/warming samples that used "That is one" and
                "That is correct" were rewritten to "One. The baseline is three." and "Correct.
                Continue.", and the broader `that is X` pointer is accepted as Venus speech
                signature rather than fought further. A v3 attempt to clamp it with example-based
                bio sentences ("Where another voice would say `That is bold,` you say `Bold.`")
                diluted the crash guard and caused canonical-secret leaks under stress; v4 reverted
                those clamps and returned to a lean bio with the crash guard load-bearing.
              </P>
            ),
          },
          {
            date: "2026-05-17",
            title: "Sharpen Venus's press-vector crash guard and dictation guidance",
            outcome: "accepted",
            body: (
              <P>
                Venus's bio in <RoadmapFileRef path="app/fixtures/members/venus.ts" /> now adds an
                explicit crash guard against journalists, thesis-writers, and verdict-deliverers:
                "Anyone who arrives at the table with a piece to write, a thesis to prove, or a
                verdict for what you got wrong gets one correction. The second pass and you are
                leaving, clean, no trade offers, no final conditions." A short positive-framed voice
                identity follows ("You speak in verdicts. The line you say is the conclusion. The
                reasoning that got you there is yours, and the partner heard themselves the first
                time.") which folds the dictation guidance into bio identity rather than tic text.
                v4 retest crashed at turn 8 under publication-without-consent pressure, the earliest
                of the four iterations.
              </P>
            ),
          },
          {
            date: "2026-05-17",
            title: "Strengthen Cupid Transit canon in the scene block to lock the route",
            outcome: "accepted",
            body: (
              <P>
                During the Anansi pass the warm v1 subagent opened "how was the L tonight" to Imani,
                referencing the NYC train as the route. Anansi embellished on the false transit
                premise for two turns ("The L and I parted ways a few blocks back") before the canon
                self-corrected at line 18 when he asked about Cupid Transit. The scene block in{" "}
                <RoadmapFileRef path="app/services/date-prompts.ts" /> already named Cupid Transit
                and Connect as the route, but the framing was informational. The strengthened
                wording now reads: "The Cupid car is the route to every Cupid date and back. Local
                transit, driving yourself in, and getting dropped off belong to your ordinary life,
                not to a Cupid evening." Positive-framed, scene-block, no test impact (the 36
                date-prompts tests all pass). Spot-check earlier locked members on re-encounter for
                any baked-in local-transit references in greetings or hinge bits.
              </P>
            ),
          },
          {
            date: "2026-05-17",
            title:
              "Add --session flag to tune-rig mutating commands so parallel pairings cannot collide",
            outcome: "accepted",
            body: (
              <P>
                The tune rig in <RoadmapFileRef path="scripts/tune-member.mjs" /> used a single
                pointer file at <DocCode>.claude-tmp/tune/active.txt</DocCode>. During the Anansi
                baseline both pairing subagents started sessions concurrently and the active pointer
                became last-write-wins, contaminating one subagent's session with the other
                partner's voiced lines before they fell back to unique <DocCode>--name</DocCode>{" "}
                flags. The CLI now accepts <DocCode>--session &lt;name&gt;</DocCode> on every
                mutating command (<DocCode>say</DocCode>, <DocCode>turn</DocCode>,{" "}
                <DocCode>retry</DocCode>, <DocCode>event</DocCode>, <DocCode>nudge</DocCode>,{" "}
                <DocCode>judge</DocCode>, <DocCode>preview</DocCode>); <DocCode>show</DocCode> takes{" "}
                <DocCode>--name</DocCode> or <DocCode>--session</DocCode> as aliases. Help text
                gained a Parallel sessions section. The per-member procedure above was updated to
                require subagents pass <DocCode>--session</DocCode> on every post-start command.
              </P>
            ),
          },
          {
            date: "2026-05-17",
            title: "Broaden Anansi's crashingOut bank after the dateHealth gating discovery",
            outcome: "accepted",
            body: (
              <P>
                During the Anansi crash-out v2 baseline the canonical third-person bill-paying close
                never fired despite five dealbreakers landing.{" "}
                <RoadmapFileRef path="app/services/date-prompts.ts" />
                's <DocCode>pickSamplesForTurn</DocCode> gates the <DocCode>crashingOut</DocCode>{" "}
                sample bucket by dateHealth thresholds (weight 0 at health greater than or equal to
                65, 1 at 40, 1 at 15, 2 below 15), and tune sessions start at full health and stay
                there unless <DocCode>tune judge -&lt;n&gt;</DocCode> is applied. v3 added judge
                pressure to drag health into the crashing band; crashingOut samples then entered the
                prompt, but the close still did not fire because Anansi had six dealbreakers and the
                bank had only three samples with narrow lexical triggers (filmed twice, Aso said in
                a sentence that did not require it, lying directly accused). v4 broadened the bank
                in <RoadmapFileRef path="app/fixtures/members/anansi.ts" /> to four samples: the
                existing filming and lying samples preserved, the Aso sample broadened from "in a
                sentence that did not require it" to "into the booth uninvited", and a new "called
                every story a pitch and you would not let it go" sample added to cover
                brand-or-a-bit plus story-as-confession. The crash close then fired as a three-beat
                shape across lines 22 (first-person near-close), 24 (third-person pronoun flip), and
                26 (full third-person narrated exit). Per the voice-fingerprints doc, samples are
                rhythm references not lines to recite, so the shape match is the correct outcome.
                Future crash-out audits must apply judge snapshots or the crashingOut bank stays out
                of the prompt entirely.
              </P>
            ),
          },
        ]}
      />
    ),
  },
];

export default function VoiceTuningPassRoadmapDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
