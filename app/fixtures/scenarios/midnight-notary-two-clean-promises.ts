import type { DateScenario } from "../../domain/game";

export const midnightNotaryTwoCleanPromises: DateScenario = {
  id: "midnight-notary-two-clean-promises",
  title: "Stamp Of Approval",
  card: {
    summary:
      "A municipal notary counter validates one boundary and one promise. Romance arrives with a stamp pad.",
    tags: ["career", "cosmic", "low_pressure"],
    risk: "medium",
    intimacy: "medium",
    chaos: "medium",
    cost: 13,
    idealFor: [
      "members who live by Vow and read a stamp as a real Bargain",
      "members whose oath voice fits a counter at 11:43 p.m.",
      "members who count the boundary form as a Trial they can pass",
      "members whose stoic clipped voice handles ceremony without performing it",
    ],
    badFor: [
      "members whose irony shield collapses on a sincere promise field",
      "members who cannot caption a stamp without diluting it",
      "members who will renegotiate the boundary line until midnight",
    ],
  },
  publicBrief: {
    location: "Counter 3 at the Municipal Office of Affectionate Records",
    premise:
      "Cupid booked a late counter at an office that certifies romantic boundaries after normal business hours. The chair behind the counter is empty tonight.",
    whatBothCharactersKnow:
      "Each member may state one boundary and one clean promise. Forms appear on the counter when the room decides they are ready. The office closes at midnight, emotionally and legally.",
    openingSituation:
      "Both members stand at counter 3. A countdown clock on the wall reads 11:43. The stamp pad is closed. No forms have appeared yet.",
  },
  director: {
    tone: "bureaucratic ceremony, brass desk lamp, one stamp pad doing too much work",
    rules: [
      "Keep promises voluntary and specific.",
      "Do not let the scene imply fate, vows, or permanent binding.",
      "The office is automated tonight. Forms slide into view, but no clerk speaks.",
    ],
    events: [
      {
        id: "midnight-notary-two-clean-promises-event-1",
        title: "Boundary form",
        kind: "reveal",
        pitch:
          "Glow the boundary form under the counter lamp with a header banning metaphors after 11:43. Forces one specific boundary in plain language.",
        beat: "The boundary form glows under the counter lamp. The header reads: plain language, no metaphors accepted after 11:43 p.m.",
        directorBeat:
          "The form is asking for one specific boundary. Say it cleanly without metaphor, ask your date what theirs is, write it on the page, or refuse the form. Be plain. Do not voice the form.",
      },
      {
        id: "midnight-notary-two-clean-promises-event-2",
        title: "Promise form",
        kind: "reveal",
        pitch:
          "Slide a second form forward with two blank promise lines and the stamp pad opening once. Forces a modest promise that respects the boundary already named.",
        beat: "A second form moves across the counter on its own. The stamp pad opens once and closes. The promise field has two blank lines.",
        directorBeat:
          "A promise field is waiting on you. Write one small specific thing, hand the pen to your date, propose mutual lines, or decline to promise. Keep it modest.",
      },
      {
        id: "midnight-notary-two-clean-promises-event-3",
        title: "Clean stamp",
        kind: "provocation",
        pitch:
          "Land the stamp once with witnessed, understood, not legally romantic advice and the clock at 11:58. Forces a clean call: claim, reject, or amend.",
        beat: "The stamp lands once. The ink reads: witnessed, understood, not legally romantic advice. The countdown clock reads 11:58.",
        directorBeat:
          "Your terms just got witnessed. Claim the stamp, reject it aloud, amend in plain language before the ink dries, or ask your date what they think of the wording. Decide cleanly. Do not voice the stamp.",
      },
      {
        id: "midnight-notary-two-clean-promises-event-4",
        title: "Stamp test",
        kind: "ambient",
        pitch:
          "Slide a scrap forward to test-stamp itself with the impression: still working, please proceed in plain language. Surfaces a small reset away from performance.",
        beat: "A small scrap of paper slides forward under the stamp. The pad inks itself. The test impression reads: still working, please proceed in plain language.",
        directorBeat:
          "The pad just reminded you what register to use. Drop into plain language with your date, simplify what you were about to say, or comment on the reset. Do not perform. Do not voice the scrap.",
      },
      {
        id: "midnight-notary-two-clean-promises-event-5",
        title: "Counter dim",
        kind: "ambient",
        pitch:
          "Dim the right brass lamp panel a notch while the left holds steady. Surfaces whether plain language can hold without spotlight.",
        beat: "The right panel of the brass counter lamp dims by a notch. The left panel holds steady. The countdown clock has not advanced for a beat.",
        directorBeat:
          "Half your spotlight just dropped. Stay in the light you have, comment on the partial dim, ask your date one honest line in the half-shadow, or step into the bright panel. Do not require full light.",
      },
      {
        id: "midnight-notary-two-clean-promises-event-6",
        title: "Form retracts",
        kind: "ambient",
        pitch:
          "Retract the boundary form a quarter inch with a still revisable tick and a thin pencil rolling out. Surfaces a quiet edit without argument.",
        beat: "The boundary form pulls back a quarter inch. The header line ticks: still revisable. A thin pencil rolls into view from the counter slot.",
        directorBeat:
          "You have one quiet chance to edit. Pick up the pencil, change one word, ask your date if they want to revise theirs, or leave the line. Be visible about the edit. Do not voice the form.",
      },
      {
        id: "midnight-notary-two-clean-promises-event-7",
        title: "Witness pen",
        kind: "reveal",
        pitch:
          "Slide a second pen parallel to the first with an optional countersignature note. Forces a stance on adding weight or choosing not to.",
        beat: "A second pen slides onto the counter parallel to the first. The header on the page now reads: optional countersignature, still witnessed without it.",
        directorBeat:
          "You can countersign or decline cleanly. Take the second pen, hand it to your date, refuse and say why, or leave it on the page. Make the call. Do not voice the pen.",
      },
      {
        id: "midnight-notary-two-clean-promises-event-8",
        title: "Pad refresh",
        kind: "provocation",
        pitch:
          "Open the stamp pad, darken the ink, close it, and advance the clock to 11:59. Forces a clean close without resentment.",
        beat: "The stamp pad opens, takes on a darker line of ink, and closes. The countdown clock advances one minute to 11:59.",
        directorBeat:
          "One minute left. Settle on witnessed-or-not, say a final honest line, ask your date if they want to amend, or step back from the counter. Do not stall into resentment. Do not voice the pad.",
      },
      {
        id: "midnight-notary-two-clean-promises-event-9",
        title: "Counter close",
        kind: "provocation",
        pitch:
          "Shut the brass lamp to pilot light and print a slip: counter closing in sixty seconds, file as is or void in plain language. Forces a clean physical move.",
        beat: "The counter lamp shuts to a low pilot light. A small slip prints from the slot: counter closing in sixty seconds, file as is or void in plain language. The countdown clock holds at 11:59.",
        directorBeat:
          "Sixty seconds to file or void. File as is, void in plain language, step back and let it void on its own, or sign with your date in the last beat. Move now. Do not voice the slip.",
      },
    ],
    earlyEndTriggers: [
      "A member uses ritual language to corner the other.",
      "A member mocks a stated boundary after it is witnessed.",
    ],
    repeatBehavior:
      "If repeated, prior witnessed boundaries remain public to the pair. The counter refuses duplicate paperwork.",
  },
  judgeRubric: {
    successSignals: [
      "The pair states boundaries without treating them as rejection.",
      "A promise stays modest enough to be believable.",
    ],
    failureSignals: [
      "A member tries to turn a boundary into a bargain.",
      "The pair performs ceremony while avoiding the terms.",
    ],
    statFocus: ["trust", "stability", "strain"],
  },
};
