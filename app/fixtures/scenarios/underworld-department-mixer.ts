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
    idealFor: ["career-focused members", "members who like clear labels"],
    badFor: ["members who hate networking", "members hiding from labels"],
  },
  publicBrief: {
    location: "The Bureau of Warm Introductions, basement level 9",
    premise: "The mixer looks corporate until the name tags start updating in real time.",
    whatBothCharactersKnow:
      "Cupid booked this as a professional casual date. The underworld considers those words compatible.",
    openingSituation:
      "Both members receive name tags. The tags leave room for pronouns, job title, and current romantic liability.",
  },
  director: {
    tone: "corporate, absurd, and brisk",
    rules: [
      "Keep the mixer in Cupid corporate register.",
      "Use name tags as public but shallow information only.",
      "Let the pair leave a bad networking bit behind if they connect.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "Name tag update",
        event: "One name tag updates after a vulnerable sentence.",
        characterVisibleText: "One name tag now reads: emotionally available, pending audit.",
        directorInstruction: "Let the wearer decide whether to own or dispute the label.",
      },
      {
        atTurn: 18,
        title: "Icebreaker form",
        event: "An underworld coordinator hands them a mandatory icebreaker form.",
        characterVisibleText: "The form asks: what are your growth areas, and who approved them.",
        directorInstruction: "Use the form to invite dry honesty.",
      },
      {
        atTurn: 26,
        title: "Exit interview",
        event: "The exit requires one sentence about whether they would meet again.",
        characterVisibleText:
          "A coordinator blocks the elevator with a clipboard and professional patience.",
        directorInstruction: "Ask for a clear next step without forcing romance.",
      },
    ],
    earlyEndTriggers: [
      "A member feels reduced to a performance review.",
      "A member uses corporate language to avoid all feeling.",
    ],
    repeatBehavior:
      "If repeated, staff have the old name tags on file and may ask whether the pair wants revised wording.",
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
