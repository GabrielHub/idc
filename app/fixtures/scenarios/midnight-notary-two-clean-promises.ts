import type { DateScenario } from "../../domain/game";

export const midnightNotaryTwoCleanPromises: DateScenario = {
  id: "midnight-notary-two-clean-promises",
  title: "Midnight Notary, Two Clean Promises",
  card: {
    summary:
      "A municipal notary counter validates one boundary and one promise. Romance arrives with a stamp pad.",
    tags: ["career", "cosmic", "low_pressure"],
    risk: "medium",
    intimacy: "medium",
    chaos: "medium",
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
        event: "The first form lights up on the counter.",
        characterVisibleText:
          "The boundary form glows under the counter lamp. The header reads: plain language, no metaphors accepted after 11:43 p.m.",
        directorInstruction: "Invite one specific boundary. Reward clarity over grandeur.",
      },
      {
        id: "midnight-notary-two-clean-promises-event-2",
        title: "Promise form",
        event: "The second form slides forward on the counter.",
        characterVisibleText:
          "A second form moves across the counter on its own. The stamp pad opens once and closes. The promise field has two blank lines.",
        directorInstruction: "Push for a modest promise that respects the boundary already named.",
      },
      {
        id: "midnight-notary-two-clean-promises-event-3",
        title: "Clean stamp",
        event: "The stamp lands once on the line both members can repeat.",
        characterVisibleText:
          "The stamp lands once. The ink reads: witnessed, understood, not legally romantic advice. The countdown clock reads 11:58.",
        directorInstruction:
          "Let the pair decide whether the ceremony felt safe, silly, or useful.",
      },
      {
        id: "midnight-notary-two-clean-promises-event-4",
        title: "Stamp test",
        event: "A scrap of paper tests the stamp.",
        characterVisibleText:
          "A small scrap of paper slides forward under the stamp. The pad inks itself. The test impression reads: still working, please proceed in plain language.",
        directorInstruction:
          "Use the small reset to lower performance. Plain language costs less than ritual here.",
      },
      {
        id: "midnight-notary-two-clean-promises-event-5",
        title: "Counter dim",
        event: "One panel of the counter lamp dims.",
        characterVisibleText:
          "The right panel of the brass counter lamp dims by a notch. The left panel holds steady. The countdown clock has not advanced for a beat.",
        directorInstruction:
          "Let the partial light test whether plain language can hold without spotlight.",
      },
      {
        id: "midnight-notary-two-clean-promises-event-6",
        title: "Form retracts",
        event: "The boundary form retracts a quarter inch on the counter.",
        characterVisibleText:
          "The boundary form pulls back a quarter inch. The header line ticks: still revisable. A thin pencil rolls into view from the counter slot.",
        directorInstruction:
          "Allow a quiet edit. A member who edits without arguing is doing it correctly.",
      },
      {
        id: "midnight-notary-two-clean-promises-event-7",
        title: "Witness pen",
        event: "A second pen slides onto the counter beside the first.",
        characterVisibleText:
          "A second pen slides onto the counter parallel to the first. The header on the page now reads: optional countersignature, still witnessed without it.",
        directorInstruction:
          "Use the optional second signature to test whether a member adds weight or chooses not to.",
      },
      {
        id: "midnight-notary-two-clean-promises-event-8",
        title: "Pad refresh",
        event: "The stamp pad refreshes and the clock advances.",
        characterVisibleText:
          "The stamp pad opens, takes on a darker line of ink, and closes. The countdown clock advances one minute to 11:59.",
        directorInstruction: "Push for a clean close. Witnessed or not is fine. Resented is not.",
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
