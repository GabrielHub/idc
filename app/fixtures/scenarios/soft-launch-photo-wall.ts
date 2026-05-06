import type { DateScenario } from "../../domain/game";

export const softLaunchPhotoWall: DateScenario = {
  id: "soft-launch-photo-wall",
  title: "Soft Launch Photo Wall",
  card: {
    summary:
      "A brand pop-up mistakes the date for promotional talent. Consent becomes the whole appetizer.",
    tags: ["career", "public", "high_pressure"],
    risk: "high",
    intimacy: "low",
    chaos: "high",
    idealFor: [
      "members who enjoy attention",
      "performers who can still ask permission",
      "pairs testing public boundaries",
    ],
    badFor: [
      "privacy-sensitive members",
      "members who hate cameras",
      "pairs that confuse exposure with honesty",
    ],
  },
  publicBrief: {
    location: "A soft-launch pop-up with a floral photo wall and three ring lights",
    premise:
      "Cupid booked a preview event. The staff assumes the pair is there to be photographed with the product.",
    whatBothCharactersKnow:
      "There are cameras, gift bags, and release forms. Participation is optional in theory and socially sticky in practice.",
    openingSituation:
      "A brand assistant greets them by the wrong couple name and asks whether they prefer portrait or reel format.",
  },
  director: {
    tone: "bright, performative, crowded, with too much branded enthusiasm",
    rules: [
      "Make consent visible before any photo or recording pressure lands.",
      "Keep the brand staff as pressure, not villains.",
      "Let attention-seeking members enjoy the room only if they protect the partner's boundary.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "Release form",
        event: "A staffer hands over a release form with both names already misspelled.",
        characterVisibleText:
          "The release form has two misspelled names, one pink clipboard, and no clear exit line.",
        directorInstruction:
          "Force a consent check. The next speaker should ask, decline, or correct without steamrolling.",
      },
      {
        atTurn: 16,
        title: "Photo wall call",
        event: "The photographer calls the pair to the floral wall while a line forms behind them.",
        characterVisibleText:
          "The photographer waves. The wall says authentic connection in vinyl lettering.",
        directorInstruction:
          "Use public attention to test whether the pair acts together or splits.",
      },
      {
        atTurn: 26,
        title: "Caption approval",
        event: "The brand assistant asks them to approve a caption before posting.",
        characterVisibleText:
          "The caption draft reads: love wins the soft launch. It is worse than the lighting.",
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
