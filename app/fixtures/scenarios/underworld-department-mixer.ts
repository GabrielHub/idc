import type { DateScenario } from "../../domain/game";

export const underworldDepartmentMixer: DateScenario = {
  id: "underworld-department-mixer",
  title: "Underworld Department Mixer",
  card: {
    summary:
      "A workplace mixer in the underworld where every name tag lists emotional availability.",
    tags: ["career", "cosmic", "public"],
    risk: "medium",
    intimacy: "medium",
    chaos: "medium",
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
    beats: [
      {
        atTurn: 10,
        title: "Name tag update",
        event: "One name tag updates after a vulnerable sentence.",
        characterVisibleText:
          "One name tag now reads: emotionally available, pending audit. The other tag's text has not changed.",
        directorInstruction: "Let the wearer decide whether to own or dispute the label.",
      },
      {
        atTurn: 20,
        title: "Icebreaker form",
        event: "An icebreaker form drops onto their high-top.",
        characterVisibleText:
          "A laminated icebreaker form lands on the high-top. The first line reads: growth areas, and who approved them.",
        directorInstruction: "Use the form to invite dry honesty.",
      },
      {
        atTurn: 28,
        title: "Exit clipboard",
        event: "A clipboard appears at the table edge as the mixer thins.",
        characterVisibleText:
          "A clipboard rests on the high-top. The top sheet asks for one sentence about whether they would meet again. The pen is already uncapped.",
        directorInstruction: "Ask for a clear next step without forcing romance.",
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
