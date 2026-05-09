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
    events: [
      {
        id: "soft-launch-photo-wall-event-1",
        title: "Release form",
        event: "The release form on the clipboard waits between them.",
        characterVisibleText:
          "The release form on the clipboard has both names misspelled. A pink pen rests on top. The signature line is highlighted.",
        directorInstruction:
          "Force a consent check. The next speaker should ask, decline, or correct without steamrolling.",
      },
      {
        id: "soft-launch-photo-wall-event-2",
        title: "Ring lights up",
        event: "The ring lights warm up. A line begins to form behind the wall.",
        characterVisibleText:
          "Three ring lights glow on. The wall reads authentic connection in vinyl lettering. A line of three couples forms behind the wall.",
        directorInstruction:
          "Use public attention to test whether the pair acts together or splits.",
      },
      {
        id: "soft-launch-photo-wall-event-3",
        title: "Caption draft",
        event: "A tablet displays a draft caption.",
        characterVisibleText:
          "A tablet on the table displays a caption draft: love wins the soft launch. The post button pulses. A staffer's hand sets a gift bag at the corner of the table and withdraws.",
        directorInstruction: "Let the pair revise, refuse, or reclaim the public story.",
      },
      {
        id: "soft-launch-photo-wall-event-4",
        title: "Gift bag drops",
        event: "A second branded gift bag is set at the table corner.",
        characterVisibleText:
          "A second pink branded gift bag lands at the table corner. Tissue paper sticks out at an angle. A small QR code on the handle is angled toward the table.",
        directorInstruction:
          "Use the soft pressure of free goods to test whether either of them owes the brand a smile.",
      },
      {
        id: "soft-launch-photo-wall-event-5",
        title: "Caption revises",
        event: "The tablet caption revises itself.",
        characterVisibleText:
          "The caption on the tablet revises itself once: two early adopters of love. The post button pulses faster. A small character counter starts ticking down.",
        directorInstruction:
          "Let the pair watch the brand reach for them. The next sentence in the room is the answer.",
      },
      {
        id: "soft-launch-photo-wall-event-6",
        title: "Other couple flashes",
        event: "A flash from the next couple lands on the photo wall.",
        characterVisibleText:
          "A flash bursts from the photo wall as another couple poses. They laugh easily. Their release form is signed and clipped to the wall behind them.",
        directorInstruction:
          "Use the easy success of strangers to test whether the pair wants the same or wants out.",
      },
      {
        id: "soft-launch-photo-wall-event-7",
        title: "Branded napkin",
        event: "A branded cocktail napkin lands under one elbow.",
        characterVisibleText:
          "A staffer's hand slides a branded napkin under one elbow and withdraws. The logo across the napkin is the same logo behind the photo wall. The release form is still half-signed.",
        directorInstruction:
          "Allow the small reminder. The brand is everywhere; they can choose how much to be in it.",
      },
      {
        id: "soft-launch-photo-wall-event-8",
        title: "Letter falls",
        event: "One vinyl letter peels off the photo wall.",
        characterVisibleText:
          "One vinyl letter peels off the photo wall and falls onto the floor. The wall now reads: authentic onnection. A staffer is already three tables away with another release form.",
        directorInstruction:
          "Push for a clean exit from the brand or a clean stay inside it on their own terms.",
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
