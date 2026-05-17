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
    "One audit per member, walked in curated roster order. Each member is read live through the AI character pipeline, then fixture or prompt fixes land before the next member is queued.",
  order: 12,
};

export const plan: RoadmapPlanMeta = {
  status: "in-flight",
  opened: "2026-05-16",
  touched: "2026-05-17",
  owner: "gabriel",
  tldr: "Walk every member in the onboarding-screen curated order, run a live tune session, lock voice or fix the fixture, then queue the next member. Out-of-order tunes are allowed but tracked here.",
  tasks: 42,
  done: 11,
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
          leakage, opaque dimensional references), and lands fixture or prompt fixes before the next
          member is queued.
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
            is curated position 10, Meridian Vale.
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
          confirms the voice is locked.
        </P>
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
              or other LLM prompt builders, re-read the four official prompt engineering guides
              linked in the References section below and the project prompt contracts in{" "}
              <DocLink to="/docs/product/voice-prompts">Voice prompts</DocLink>. Every prompt edit
              goes through these principles: positive framing, context-first, outcome-not-process,
              reserve absolutes for true invariants, let the model decide behavior.
            </span>,
            <span key="pick-partners">
              Pick two partners from the roster for this focus member: a{" "}
              <Strong>warm pairing</Strong> (tag overlap, complementary register, no dealbreaker
              triggers, preferences that line up) and a <Strong>crash-out pairing</Strong> (a
              partner whose default voice and likely behavior would hit one or more of the focus
              member's dealbreakers within the first few turns, enough that the focus member ends
              the date early). Justify both picks in a sentence with the fixture evidence.
            </span>,
            <span key="spawn-subagents">
              For each pairing, spawn a fresh worker subagent to play the partner side. The subagent
              owns the tune session for that pairing end to end: it runs{" "}
              <DocCode>
                vp run tune -- start &lt;focus-id&gt; --partner &lt;partner-id&gt; --name
                &lt;session-name&gt;
              </DocCode>
              , authors each <DocCode>say</DocCode> line (passing{" "}
              <DocCode>--session &lt;session-name&gt;</DocCode> on every command after start so
              parallel pairings cannot collide on the shared{" "}
              <DocCode>.claude-tmp/tune/active.txt</DocCode> pointer), and returns the full
              transcript. Feed the subagent the partner's fixture content (bio, dating profile,
              register, tics, sample messages, dealbreakers, refused patterns), the focus member's
              name, the scenario, and the partner-play rules in{" "}
              <DocLink to="/docs/product/voice-prompts">Voice prompts</DocLink> plus this plan's
              decisions log: stay strictly in the partner's voice, do not become a question-machine,
              do not blur professions, respect tics-as-seasoning, and respect IDC venue and transit
              canon. Neither member chose the place, Cupid did, and members arrive via Cupid Transit
              by car-gate-flash, not by local transit. Do not let the subagent improvise outside the
              partner's documented voice, and do not let the partner's opening line credit the focus
              member for the venue, the time, the route, or the match itself, since the opening line
              becomes the first thing the focus member's prompt sees and a canon violation in turn
              one contaminates the whole transcript. For crash-out audits, brief the subagent to
              apply{" "}
              <DocCode>
                tune judge -&lt;n&gt; --note "&lt;reason&gt;" --session &lt;name&gt;
              </DocCode>{" "}
              snapshots between turns after clear dealbreaker landings, pacing the pressure so
              dateHealth crosses into the crashingOut-eligible bands (less than 65 for any
              crashingOut weight, less than 40 to start cooling-dominant, less than 15 for maxed
              crash bucket); without judge pressure the crashingOut sample bucket stays at weight
              zero and the close cannot fire.
            </span>,
            <span key="review-transcripts">
              Read both returned transcripts. The warm transcript verifies engagement, hobby
              reveals, two-stage tics, and chemistry. The crash-out transcript verifies the cooling
              and crashing-out sample voices, that dealbreakers fire cleanly, and that the focus
              member ends the date with dignity.{" "}
              <Strong>
                Every transcript produced during the audit cycle, including retests after fixture or
                prompt fixes, must be surfaced to the user verbatim inside fenced code blocks, with
                each line numbered and labeled by speaker first name in turn order
              </Strong>{" "}
              so the user can read and analyze alongside. The subagent observation note follows the
              transcript, never replaces it.
            </span>,
            <span key="flag-fix">
              Flag caricature, leaked prescription, opaque dimensional reference, profile-chase
              loops, profile-mirror leakage, or anti-pattern punctuation. Fix at the smallest
              correct surface: fixture line, shared prompt scaffold, or systemic helper.
            </span>,
            <span key="retest-lock">
              Retest after each fix until the user confirms the voice is locked. Mark the checklist
              entry done only after lock.
            </span>,
            <span key="update-plan-live">
              <Strong>Update this plan before moving to the next member.</Strong> Set the locked
              entry's <DocCode>defaultDone: true</DocCode> with a short suffix note, bump{" "}
              <DocCode>plan.done</DocCode> and <DocCode>plan.touched</DocCode> in the header, and
              add any systemic fix to the decisions log below with the file references. The plan is
              the queue of record; the cursor only stays honest if the file is edited the moment a
              lock happens.
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
          Mandatory reading before editing any IDC LLM prompt builder. The source guides are listed
          here so the principles can be re-derived from authority instead of paraphrased from
          memory. The project-specific application lives in{" "}
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
            label: "10 · Meridian Vale",
          },
          {
            id: "aldric-vale-marsh",
            label: "11 · Aldric Vale Marsh",
          },
          {
            id: "sana-karim",
            label: "12 · Sana Karim",
          },
          {
            id: "imani-wallace",
            label: "13 · Imani Wallace (tuned out of order, locked 2026-05-16)",
            defaultDone: true,
          },
          {
            id: "epsy",
            label: "14 · Epsy",
          },
          {
            id: "marcus-pellish",
            label: "15 · Marcus Pellish",
          },
          {
            id: "cassie-conners",
            label: "16 · Cassie Conners",
          },
          {
            id: "calvin-hewes",
            label: "17 · Calvin Hewes",
          },
          {
            id: "gabriel-tan",
            label: "18 · Gabriel Tan",
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
          "The checklist done count equals 42 and matches plan.done in the header.",
          "Any systemic prompt or fixture-scaffold change made during the pass is recorded in the decisions log so out-of-order or early-pass members are flagged for re-tune if the change shifts their voice.",
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
