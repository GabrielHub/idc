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
  touched: "2026-05-17",
  owner: "gabriel",
  tldr: "Walk every member in the onboarding-screen curated order, run live tune sessions, lock only when the scene is funny and interesting to read, then queue the next member. Out-of-order tunes are allowed but tracked here.",
  tasks: 42,
  done: 19,
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
            is curated position 19, Sera Vohn.
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
              the focus member for the venue, the time, the route, or the match itself. With{" "}
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
            label: "19 · Sera Vohn",
          },
          {
            id: "mei-sato",
            label: "20 · Mei Sato",
          },
          {
            id: "decimus-marius-tullio",
            label: "21 · Decimus Marius Tullio",
          },
          {
            id: "eleanor-ash",
            label: "22 · Eleanor Ash",
          },
          {
            id: "alex-yoon",
            label: "23 · Alex Yoon",
          },
          {
            id: "bai-wenshu",
            label: "24 · Bai Wenshu",
          },
          {
            id: "anubis",
            label: "25 · Anubis",
          },
          {
            id: "mira-park",
            label: "26 · Mira Park",
          },
          {
            id: "cthala",
            label: "27 · Cthala",
          },
          {
            id: "ryan-doyle",
            label: "28 · Ryan Doyle",
          },
          {
            id: "junie-marrow",
            label: "29 · Junie Marrow",
          },
          {
            id: "naia-velorae",
            label: "30 · Naia Velorae",
          },
          {
            id: "noah-kim",
            label: "31 · Noah Kim",
          },
          {
            id: "reaver",
            label: "32 · Reaver",
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
                walkout can all pass. Judge pressure in tune sessions remains useful for exposing
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
