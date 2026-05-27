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
    flow: "conversation",
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
        pitch:
          "Update one tag mid-conversation to emotionally available, pending audit. Forces a stance: own the label or dispute it.",
        beat: "One name tag now reads: emotionally available, pending audit. The other tag's text has not changed.",
        directorBeat:
          "The room just relabeled one of you. Read the new line aloud, dispute the audit framing, ask your date what theirs says, or accept it dryly. Take a stance. Do not voice the tag.",
      },
      {
        id: "underworld-department-mixer-event-2",
        title: "Icebreaker form",
        kind: "reveal",
        pitch:
          "Drop a laminated icebreaker form: growth areas, and who approved them. Forces dry honesty about a growth area from existing context.",
        beat: "A laminated icebreaker form lands on the high-top. The first line reads: growth areas, and who approved them.",
        directorBeat:
          "The form is asking for a growth area. Name one you already know about yourself, ask your date for theirs, refuse to fill the page, or audit the question itself. Speak only from your own register. Do not voice the form.",
      },
      {
        id: "underworld-department-mixer-event-3",
        title: "Exit clipboard",
        kind: "provocation",
        pitch:
          "Land a clipboard asking for one sentence on whether they would meet again. Forces a clear next step without forcing romance.",
        beat: "A clipboard rests on the high-top. The top sheet asks for one sentence about whether they would meet again. The pen is already uncapped.",
        directorBeat:
          "A sentence about a second meeting is being requested. Write yes with a reason, write no with a reason, ask your date what they would write, or set the pen down without filling either line. Make the call. Do not voice the clipboard.",
      },
      {
        id: "underworld-department-mixer-event-4",
        title: "Tag delivery",
        kind: "reveal",
        pitch:
          "Slide a fresh sleeve of blank name tags onto the high-top with: revisions accepted at any time. Surfaces whether either rewrites their own tag in their real voice.",
        beat: "A coordinator slides a fresh sleeve of blank name tags onto the high-top. A small note clipped to the front reads: revisions accepted at any time. The coordinator does not stop.",
        directorBeat:
          "You can rewrite your label. Take a blank tag and revise yours, offer your date one, comment on the revision policy, or push the sleeve aside. Do not voice the coordinator.",
      },
      {
        id: "underworld-department-mixer-event-5",
        title: "Drink ticket",
        kind: "ambient",
        pitch:
          "Drop a small drink ticket for one beverage of restraint per person on the bureau. Surfaces whether either uses the comp without making it a transaction.",
        beat: "A small drink ticket lands on the high-top. The header reads: one beverage of restraint per person, on the bureau. The font is the same as the icebreaker form.",
        directorBeat:
          "A drink on the underworld is offered. Take both, hand one to your date, joke about the beverage of restraint, or leave them. Make the small choice. Do not voice the ticket.",
      },
      {
        id: "underworld-department-mixer-event-6",
        title: "Fluorescent flicker",
        kind: "ambient",
        pitch:
          "Flicker the fluorescent over the high-top and steady it. Surfaces steadiness or a need to comment on the room.",
        beat: "The corporate fluorescent above the high-top flickers and steadies. The mixer floor music is on a low loop. The other tags around the room update at the same rate.",
        directorBeat:
          "A small lighting glitch happened on you. Stay focused on your date, comment on the flicker, glance around at the other tags, or ignore it. Show whether the room rattles you.",
      },
      {
        id: "underworld-department-mixer-event-7",
        title: "Peer table",
        kind: "ambient",
        pitch:
          "Run two people at the next high-top comparing tags with one revised three times tonight. Surfaces ambient social pressure to use or refuse.",
        beat: "Two people at the next high-top compare their name tags. One of the tags has been revised three times tonight. They laugh. Their laugh does not carry far.",
        directorBeat:
          "Someone else is in the same mixer as you. Notice their laugh quietly, comment to your date on the three revisions, ignore them, or use the cover. Do not voice the peer table.",
      },
      {
        id: "underworld-department-mixer-event-8",
        title: "Survey buzzer",
        kind: "provocation",
        pitch:
          "Sound a brief survey buzzer with two peripheral tags resetting to blank. Forces a clean entry on the clipboard or a clean refusal.",
        beat: "A small survey buzzer sounds across the mixer floor. The sound is brief. Two name tags reset to blank in the periphery. The clipboard at their high-top has not been picked up.",
        directorBeat:
          "The room just asked everyone for a check-in. Pick up the pen and write, refuse aloud, hand the clipboard to your date, or check what they want first. Take the call cleanly.",
      },
      {
        id: "underworld-department-mixer-event-9",
        title: "Audit hold",
        kind: "provocation",
        pitch:
          "Freeze both tags with a slow red border and a card: confirm or release tonight's labels before the next bell. Forces a clean call on the labels.",
        beat: "Both name tags lock and pulse a slow red border. A laminated card slides up from the high-top reading: confirm or release tonight's labels before the next bell.",
        directorBeat:
          "The mixer is locking your labels. Confirm both with your date, release both aloud, split the call, or stand and walk before the bell. Decide. Do not voice the card.",
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
