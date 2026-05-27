import type { DateScenario } from "../../domain/game";

export const softLaunchPhotoWall: DateScenario = {
  id: "soft-launch-photo-wall",
  title: "Consent Is The Appetizer",
  card: {
    summary:
      "A brand pop-up has set the pair up at a small bistro table across from a photo wall. Consent becomes the whole appetizer.",
    tags: ["career", "public", "high_pressure"],
    risk: "high",
    intimacy: "low",
    chaos: "high",
    cost: 22,
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
    flow: "pressure",
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
        pitch:
          "Set the release form on the table with both names misspelled, a highlighted signature line, and a pink pen. Forces a real consent check.",
        beat: "The release form on the clipboard has both names misspelled. A pink pen rests on top. The signature line is highlighted.",
        directorBeat:
          "A release form is asking for your name. Read the misspellings aloud, ask your date if they want to sign, decline cleanly, or correct the names with the pen. Do not steamroll either way.",
      },
      {
        id: "soft-launch-photo-wall-event-2",
        title: "Ring lights up",
        kind: "reveal",
        pitch:
          "Warm three ring lights with a line of three couples forming behind the AUTHENTIC CONNECTION wall. Surfaces team or split based on each member's stance on being seen.",
        beat: "Three ring lights glow on. The wall reads authentic connection in vinyl lettering. A line of three couples forms behind the wall.",
        directorBeat:
          "The room is now lit and watching. Move with your date toward the wall, hold the table, comment on the vinyl, or ask if they want the photo. Speak only from your existing stance on visibility. Do not voice the line.",
      },
      {
        id: "soft-launch-photo-wall-event-3",
        title: "Caption draft",
        kind: "reveal",
        pitch:
          "Display a caption draft on the tablet: love wins the soft launch with a pulsing post button and a gift bag placed by a hand. Forces a revise, refuse, or reclaim.",
        beat: "A tablet on the table displays a caption draft: love wins the soft launch. The post button pulses. A staffer's hand sets a gift bag at the corner of the table and withdraws.",
        directorBeat:
          "Someone wrote a future caption about you. Revise the line, refuse to be summarized, hand the tablet to your date for theirs, or hit cancel. Do not voice the staffer.",
      },
      {
        id: "soft-launch-photo-wall-event-4",
        title: "Gift bag drops",
        kind: "ambient",
        pitch:
          "Plant a second pink branded gift bag with tissue paper and a QR code angled at the table. Forces a stance on whether the pair owes the brand a smile.",
        beat: "A second pink branded gift bag lands at the table corner. Tissue paper sticks out at an angle. A small QR code on the handle is angled toward the table.",
        directorBeat:
          "Free goods are stacking up. Slide the bag aside, comment on the QR code to your date, accept it with a smile that costs you nothing, or refuse aloud. Make the small choice visible.",
      },
      {
        id: "soft-launch-photo-wall-event-5",
        title: "Caption revises",
        kind: "ambient",
        pitch:
          "Auto-revise the caption to two early adopters of love with the post button pulsing faster. Surfaces ambient brand churn that does not need an answer.",
        beat: "The caption on the tablet revises itself once: two early adopters of love. The post button pulses faster. A small character counter starts ticking down.",
        directorBeat:
          "The brand is editing you in real time. Comment on the new framing, ignore the pulsing button, ask your date how they feel about being early adopters, or kill the screen. Do not let it post on autopilot. Do not voice the tablet.",
      },
      {
        id: "soft-launch-photo-wall-event-6",
        title: "Other couple flashes",
        kind: "reveal",
        pitch:
          "Burst a flash from another couple on the photo wall with their signed release clipped behind them. Surfaces what the pair already wants.",
        beat: "A flash bursts from the photo wall as another couple poses. They laugh easily. Their release form is signed and clipped to the wall behind them.",
        directorBeat:
          "Someone else just did the photo thing easily. Notice it without judging it, comment to your date on the ease, ask if you want that, or look back at your table. Speak only from your own register. Do not voice the couple.",
      },
      {
        id: "soft-launch-photo-wall-event-7",
        title: "Branded napkin",
        kind: "ambient",
        pitch:
          "Slide a branded napkin under one elbow with the same logo as the photo wall and the release still half-signed. Surfaces a small reminder of the brand's reach.",
        beat: "A staffer's hand slides a branded napkin under one elbow and withdraws. The logo across the napkin is the same logo behind the photo wall. The release form is still half-signed.",
        directorBeat:
          "The brand is at your elbow. Move it aside, dab a drink with it, comment on the logo to your date, or ignore the touch. Show how much of the brand you accept. Do not voice the staffer.",
      },
      {
        id: "soft-launch-photo-wall-event-8",
        title: "Letter falls",
        kind: "provocation",
        pitch:
          "Peel a vinyl letter off the photo wall so it reads AUTHENTIC ONNECTION. Forces a clean call: exit the brand or stay on your terms.",
        beat: "One vinyl letter peels off the photo wall and falls onto the floor. The wall now reads: authentic onnection. A staffer is already three tables away with another release form.",
        directorBeat:
          "The set just glitched. Laugh out loud with your date about the broken word, propose leaving, name what authentic actually means to you, or sign the release on your terms. Speak the call. Do not voice the wall.",
      },
      {
        id: "soft-launch-photo-wall-event-9",
        title: "Camera pivots",
        kind: "provocation",
        pitch:
          "Swivel a wall-mounted camera onto the bistro table with a red recording light on. Forces a physical answer.",
        beat: "A small wall-mounted camera by the photo wall swivels on its mount until the lens is aimed at their bistro table. A red recording dot lights below the lens. The release form is still half-signed.",
        directorBeat:
          "A lens is now pointed at you. Cover it, walk out of frame, sign the release because you decide to, or kill the post and pocket the bag. Move physically in this beat. Do not voice the camera.",
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
