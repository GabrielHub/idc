import type { DateScenario } from "../../domain/game";

export const listeningBoothAfterClose: DateScenario = {
  id: "listening-booth-after-close",
  title: "Listening Booth After Close",
  card: {
    summary:
      "A record shop listening booth after closing. The music understands the room but keeps its mouth shut.",
    tags: ["haunted", "domestic", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    idealFor: [
      "members who have spent decades on one piece and know the silence",
      "members whose grief is a fact they can sit beside without performing",
      "members whose quiet hand fits a needle that catches on a soft chord",
      "members who treat a track as something to finish before saying anything",
    ],
    badFor: [
      "members whose silence anxiety will fill the booth before the first chord",
      "members who will film the haunting and ruin the room",
      "members with no crowd inside one lamp and one record",
    ],
  },
  publicBrief: {
    location: "Booth 2 at Needle & Thread Records, after close",
    premise:
      "The shop owner left the pair in a private listening booth with one lamp and a stack of unlabeled records. The booth runs by itself; the owner is in the back office.",
    whatBothCharactersKnow:
      "The records may match the mood of the room. They do not expose secrets and they do not take requests well.",
    openingSituation:
      "The booth door clicks shut. Both members sit on either side of the small turntable. A record lowers itself onto the platter before either member touches it.",
  },
  director: {
    tone: "warm vinyl hiss, dust in lamplight, private without becoming solemn",
    rules: [
      "Anchor the date to booth 2. The pair does not leave for the front of the store.",
      "Use music as emotional weather, not revelation.",
      "Do not force grief disclosure or private memory.",
      "Let silence count as participation when the pair earns it.",
    ],
    events: [
      {
        id: "listening-booth-after-close-event-1",
        title: "First track",
        event: "The first record starts.",
        characterVisibleText:
          "The speakers crackle and the song starts. There are no lyrics. The track has a very specific opinion about restraint.",
        directorInstruction:
          "Invite a small reaction. The speaker can name the feeling without naming a wound.",
      },
      {
        id: "listening-booth-after-close-event-2",
        title: "Skipped groove",
        event: "The needle catches and repeats one chord.",
        characterVisibleText:
          "The needle catches on the same soft chord and repeats it. The booth waits with unacceptable patience. The lamp does not flicker.",
        directorInstruction:
          "Push for one cleaner answer, then move on before the room becomes therapy.",
      },
      {
        id: "listening-booth-after-close-event-3",
        title: "House lights",
        event: "The house lights ease up a notch and the final sleeve appears on the side table.",
        characterVisibleText:
          "The booth lights lift one notch. A blank record sleeve slides onto the side table. It has two empty lines where names could go. A pen rests beside it.",
        directorInstruction: "Let the pair choose privacy, ritual, or a grounded goodbye.",
      },
      {
        id: "listening-booth-after-close-event-4",
        title: "Side flip",
        event: "The record flips itself to side B.",
        characterVisibleText:
          "The arm lifts on its own. The platter pauses, and the record turns over to side B. The lamp does not flicker. The first chord lands cleaner than the last side.",
        directorInstruction:
          "Use the unforced continuation to surface stillness or restlessness without naming it.",
      },
      {
        id: "listening-booth-after-close-event-5",
        title: "Lamp dims",
        event: "The bulb in the lamp dims by half a stop.",
        characterVisibleText:
          "The bulb in the booth's single lamp dims by half a stop. The dust in the light is now barely visible. The room does not feel emptier, only later.",
        directorInstruction:
          "Allow the shadow. A member who reaches for a lamp switch is asking a question.",
      },
      {
        id: "listening-booth-after-close-event-6",
        title: "Empty sleeve",
        event: "An empty sleeve slides into the discard bin.",
        characterVisibleText:
          "A blank sleeve slides itself into the discard bin beside the turntable. The label is in pencil and unreadable. The bin already has two sleeves in it.",
        directorInstruction: "Let the small clearing be a small clearing. Do not give it meaning.",
      },
      {
        id: "listening-booth-after-close-event-7",
        title: "Front door bell",
        event: "The shop's front door bell chimes faintly down the hall.",
        characterVisibleText:
          "The front door bell of the shop chimes once down the hall and stops. A back-office voice calls out a soft good night. The booth door stays closed.",
        directorInstruction:
          "Use the distant world to make the booth more present, not more haunted.",
      },
      {
        id: "listening-booth-after-close-event-8",
        title: "Stack settles",
        event: "The unlabeled stack of records settles to one side.",
        characterVisibleText:
          "The stack of unlabeled records on the side table tilts a quarter inch to one side. Nothing falls. The lamp catches the spine of the topmost sleeve.",
        directorInstruction: "Push for a clean ending sentence. The booth will close on its own.",
      },
    ],
    earlyEndTriggers: [
      "A member treats grief as ambience.",
      "A member turns the booth into a seance or content setup.",
    ],
    repeatBehavior:
      "If repeated, the booth remembers only public songs the pair already heard together. It should not escalate into confession machinery.",
  },
  judgeRubric: {
    successSignals: [
      "A member lets silence protect the other instead of punishing it.",
      "The pair uses the music to soften a question without forcing an answer.",
    ],
    failureSignals: [
      "A member demands a private story the room did not ask for.",
      "The pair debates the haunting and ignores each other.",
    ],
    statFocus: ["trust", "chemistry", "relationshipHealth"],
  },
};
