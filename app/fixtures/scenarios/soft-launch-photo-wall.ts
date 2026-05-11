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
        kind: "provocation",
        event: "The release form on the clipboard waits between them.",
        characterVisibleText:
          "The release form on the clipboard has both names misspelled. A pink pen rests on top. The signature line is highlighted.",
        directorInstruction:
          "Force a consent check. The next speaker should ask, decline, or correct without steamrolling.",
      },
      {
        id: "soft-launch-photo-wall-event-2",
        title: "Ring lights up",
        kind: "reveal",
        event: "The ring lights warm up. A line begins to form behind the wall.",
        characterVisibleText:
          "Three ring lights glow on. The wall reads authentic connection in vinyl lettering. A line of three couples forms behind the wall.",
        directorInstruction:
          "Use public attention to surface whether the pair acts together or splits, drawn from each member's existing stance on being seen. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "soft-launch-photo-wall-event-3",
        title: "Caption draft",
        kind: "reveal",
        event: "A tablet displays a draft caption.",
        characterVisibleText:
          "A tablet on the table displays a caption draft: love wins the soft launch. The post button pulses. A staffer's hand sets a gift bag at the corner of the table and withdraws.",
        directorInstruction:
          "Let the pair revise, refuse, or reclaim the public story. Staff hands do not speak. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "soft-launch-photo-wall-event-4",
        title: "Gift bag drops",
        kind: "ambient",
        event: "A second branded gift bag is set at the table corner.",
        characterVisibleText:
          "A second pink branded gift bag lands at the table corner. Tissue paper sticks out at an angle. A small QR code on the handle is angled toward the table.",
        directorInstruction:
          "Use the soft pressure of free goods to test whether either of them owes the brand a smile.",
      },
      {
        id: "soft-launch-photo-wall-event-5",
        title: "Caption revises",
        kind: "ambient",
        event: "The tablet caption revises itself.",
        characterVisibleText:
          "The caption on the tablet revises itself once: two early adopters of love. The post button pulses faster. A small character counter starts ticking down.",
        directorInstruction:
          "Let the small auto-revision pass as ambient brand churn. The pair does not need to answer it. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "soft-launch-photo-wall-event-6",
        title: "Other couple flashes",
        kind: "reveal",
        event: "A flash from the next couple lands on the photo wall.",
        characterVisibleText:
          "A flash bursts from the photo wall as another couple poses. They laugh easily. Their release form is signed and clipped to the wall behind them.",
        directorInstruction:
          "Use the easy success of strangers to surface what the pair already wants. Do not voice the other couple.",
      },
      {
        id: "soft-launch-photo-wall-event-7",
        title: "Branded napkin",
        kind: "ambient",
        event: "A branded cocktail napkin lands under one elbow.",
        characterVisibleText:
          "A staffer's hand slides a branded napkin under one elbow and withdraws. The logo across the napkin is the same logo behind the photo wall. The release form is still half-signed.",
        directorInstruction:
          "Allow the small reminder. The brand is everywhere; they can choose how much to be in it. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "soft-launch-photo-wall-event-8",
        title: "Letter falls",
        kind: "provocation",
        event: "One vinyl letter peels off the photo wall.",
        characterVisibleText:
          "One vinyl letter peels off the photo wall and falls onto the floor. The wall now reads: authentic onnection. A staffer is already three tables away with another release form.",
        directorInstruction:
          "Push for a clean exit from the brand or a clean stay inside it on their own terms. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "soft-launch-photo-wall-event-9",
        title: "Camera pivots",
        kind: "provocation",
        event: "A wall-mounted camera swivels onto the bistro table.",
        characterVisibleText:
          "A small wall-mounted camera by the photo wall swivels on its mount until the lens is aimed at their bistro table. A red recording dot lights below the lens. The release form is still half-signed.",
        directorInstruction:
          "Push for a physical answer: cover the lens, walk out of frame, sign the release, or kill the post. The camera will not look away first.",
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
