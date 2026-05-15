import type { DateScenario } from "../../domain/game";

export const underworldDepartmentMixer: DateScenario = {
  id: "underworld-department-mixer",
  title: "Name Tag: Emotional Availability",
  card: {
    summary:
      "A workplace mixer in the underworld where every name tag lists emotional availability.",
    tags: ["career", "cosmic", "public"],
    risk: "medium",
    intimacy: "medium",
    chaos: "medium",
    cost: 22,
    idealFor: [
      "members who relax around a confirmed name tag and a reservation",
      "members whose pitch voice fits a high-top",
      "members who read an icebreaker form as a Term draft",
      "members who convert a label update into a quarterly metric",
    ],
    badFor: [
      "members whose anxious spiral reads every label revision as a verdict",
      "members who treat a form as a Pact and try to sign it in blood",
      "members with no use for an audited growth area",
    ],
  },
  publicBrief: {
    location: "A high-top in the corner at the Bureau of Warm Introductions, basement level 9",
    premise: "The mixer looks corporate until the name tags start updating in real time.",
    whatBothCharactersKnow:
      "Cupid booked this as a professional casual date. The underworld considers those words compatible. Their high-top is theirs for the night.",
    openingSituation:
      "Both members stand at the high-top. Their name tags are already on. The tags include pronouns, job title, and current romantic liability.",
  },
  director: {
    tone: "corporate, absurd, and brisk",
    rules: [
      "Keep the mixer in Cupid corporate register.",
      "Use name tags and printed forms as public information. Coordinators are silent ambient pressure.",
      "Anchor to the high-top. The mixer floor surrounds them but does not pull them away.",
    ],
    events: [
      {
        id: "underworld-department-mixer-event-1",
        title: "Name tag update",
        kind: "reveal",
        event: "One name tag updates after a vulnerable sentence.",
        characterVisibleText:
          "One name tag now reads: emotionally available, pending audit. The other tag's text has not changed.",
        directorInstruction:
          "Let the wearer decide whether to own or dispute the label. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "underworld-department-mixer-event-2",
        title: "Icebreaker form",
        kind: "reveal",
        event: "An icebreaker form drops onto their high-top.",
        characterVisibleText:
          "A laminated icebreaker form lands on the high-top. The first line reads: growth areas, and who approved them.",
        directorInstruction:
          "Use the form to invite dry honesty. Either may name a growth area drawn from what they already show on file. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "underworld-department-mixer-event-3",
        title: "Exit clipboard",
        kind: "provocation",
        event: "A clipboard appears at the table edge as the mixer thins.",
        characterVisibleText:
          "A clipboard rests on the high-top. The top sheet asks for one sentence about whether they would meet again. The pen is already uncapped.",
        directorInstruction:
          "Ask for a clear next step without forcing romance. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "underworld-department-mixer-event-4",
        title: "Tag delivery",
        kind: "reveal",
        event: "A coordinator drops a fresh sleeve of name tags at the high-top.",
        characterVisibleText:
          "A coordinator slides a fresh sleeve of blank name tags onto the high-top. A small note clipped to the front reads: revisions accepted at any time. The coordinator does not stop.",
        directorInstruction:
          "Use the small offer of revision to test whether either of them rewrites their tag in their own real voice. Coordinators do not speak. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "underworld-department-mixer-event-5",
        title: "Drink ticket",
        kind: "ambient",
        event: "A drink ticket appears on the high-top.",
        characterVisibleText:
          "A small drink ticket lands on the high-top. The header reads: one beverage of restraint per person, on the bureau. The font is the same as the icebreaker form.",
        directorInstruction:
          "Allow either of them to use the small comp without making it a transaction. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "underworld-department-mixer-event-6",
        title: "Fluorescent flicker",
        kind: "ambient",
        event: "The corporate fluorescent above the high-top flickers.",
        characterVisibleText:
          "The corporate fluorescent above the high-top flickers and steadies. The mixer floor music is on a low loop. The other tags around the room update at the same rate.",
        directorInstruction:
          "Use the small lighting glitch to surface either steadiness or a need to comment on the room.",
      },
      {
        id: "underworld-department-mixer-event-7",
        title: "Peer table",
        kind: "ambient",
        event: "The next high-top compares their tags out loud.",
        characterVisibleText:
          "Two people at the next high-top compare their name tags. One of the tags has been revised three times tonight. They laugh. Their laugh does not carry far.",
        directorInstruction:
          "Allow the ambient social pressure. The pair can use it or refuse to use it. Do not voice the peer table as continuing speakers.",
      },
      {
        id: "underworld-department-mixer-event-8",
        title: "Survey buzzer",
        kind: "provocation",
        event: "A survey buzzer sounds across the floor.",
        characterVisibleText:
          "A small survey buzzer sounds across the mixer floor. The sound is brief. Two name tags reset to blank in the periphery. The clipboard at their high-top has not been picked up.",
        directorInstruction:
          "Push for a clean entry on the clipboard or a clean refusal to fill one out.",
      },
      {
        id: "underworld-department-mixer-event-9",
        title: "Audit hold",
        kind: "provocation",
        event: "Both name tags freeze and request a confirm.",
        characterVisibleText:
          "Both name tags lock and pulse a slow red border. A laminated card slides up from the high-top reading: confirm or release tonight's labels before the next bell.",
        directorInstruction:
          "Push for a clean call on the labels: confirm both, release both, or split. The buzzer will return if neither member moves. Do not voice any background person or cue as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member feels reduced to a performance review.",
      "A member uses corporate language to avoid all feeling.",
    ],
    repeatBehavior:
      "If repeated, the high-top is held. The old name tags are on file and may print again with revised wording.",
  },
  judgeRubric: {
    successSignals: [
      "The pair uses structure to say something direct.",
      "A member sees past the label on the other member's tag.",
    ],
    failureSignals: [
      "The pair hides behind workplace language.",
      "A member treats the date as a literal audit.",
    ],
    statFocus: ["trust", "stability", "strain"],
  },
};
