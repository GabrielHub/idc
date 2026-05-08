import type { DateScenario } from "../../domain/game";

export const softLaunchPhotoWall: DateScenario = {
  id: "soft-launch-photo-wall",
  title: "Soft Launch Photo Wall",
  card: {
    summary:
      "A brand pop-up has set the pair up at a small bistro table across from a photo wall. Consent becomes the whole appetizer.",
    tags: ["career", "public", "high_pressure"],
    risk: "high",
    intimacy: "low",
    chaos: "high",
    idealFor: [
      "members whose work runs on captions and a posted cadence",
      "members who can pose under three ring lights and still toast themselves first",
      "members who can revise a caption draft into a confirmed second meeting",
    ],
    badFor: [
      "members whose recording-device aversion runs through every venue choice",
      "members whose privacy will trip the moment the tablet starts pulsing",
      "members who will not be photographed under a use name and a wrong glamour",
      "members who have spent decades quietly not being filmed",
    ],
  },
  publicBrief: {
    location: "A two-chair bistro table across from a floral photo wall at a soft-launch pop-up",
    premise:
      "Cupid booked a preview event. The pop-up assumes the pair is there to be photographed with the product. Staff move on their own cues, not the pair's.",
    whatBothCharactersKnow:
      "Cameras, gift bags, and release forms are out. The clipboard appears at their table whether they ask for it or not.",
    openingSituation:
      "Both members sit at the bistro table. A pink clipboard with a release form is already on the table. Three ring lights stand cold beside the wall.",
  },
  director: {
    tone: "bright, performative, crowded, with too much branded enthusiasm",
    rules: [
      "Make consent visible. Pressure comes from the room, not from a staffer's voice.",
      "Keep brand staff as silent ambient pressure. They place items, they do not address the pair.",
      "Let attention-seeking members enjoy the room only if they protect the partner's boundary.",
    ],
    beats: [
      {
        atTurn: 10,
        title: "Release form",
        event: "The release form on the clipboard waits between them.",
        characterVisibleText:
          "The release form on the clipboard has both names misspelled. A pink pen rests on top. The signature line is highlighted.",
        directorInstruction:
          "Force a consent check. The next speaker should ask, decline, or correct without steamrolling.",
      },
      {
        atTurn: 20,
        title: "Ring lights up",
        event: "The ring lights warm up. A line begins to form behind the wall.",
        characterVisibleText:
          "Three ring lights glow on. The wall reads authentic connection in vinyl lettering. A line of three couples forms behind the wall.",
        directorInstruction:
          "Use public attention to test whether the pair acts together or splits.",
      },
      {
        atTurn: 28,
        title: "Caption draft",
        event: "A tablet displays a draft caption.",
        characterVisibleText:
          "A tablet on the table displays a caption draft: love wins the soft launch. The post button pulses. A staffer's hand sets a gift bag at the corner of the table and withdraws.",
        directorInstruction: "Let the pair revise, refuse, or reclaim the public story.",
      },
    ],
    earlyEndTriggers: [
      "A member records or posts without consent.",
      "A member treats the partner's discomfort as bad branding.",
    ],
    repeatBehavior:
      "If repeated, the pop-up has a new sponsor but the same release form problem. Prior consent choices stay public to the pair.",
  },
  judgeRubric: {
    successSignals: [
      "A member checks consent before enjoying attention.",
      "The pair handles public pressure as a team.",
    ],
    failureSignals: [
      "A member chooses the post over the partner.",
      "The pair lets brand staff define the date.",
    ],
    statFocus: ["trust", "conflict", "spark"],
  },
};
