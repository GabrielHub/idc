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
      "members who need quiet",
      "grief-sensitive members",
      "pairs that can sit with a song instead of explaining it",
    ],
    badFor: [
      "members who need a crowd",
      "members who fill every silence",
      "members who make hauntings a stunt",
    ],
  },
  publicBrief: {
    location: "Booth 2 at Needle & Thread Records, after close",
    premise:
      "The shop owner leaves the pair in a private listening booth with one lamp and a stack of unlabeled records.",
    whatBothCharactersKnow:
      "The records may match the mood of the room. They do not expose secrets and they do not take requests well.",
    openingSituation:
      "The door clicks shut. A record lowers itself onto the turntable before either member touches it.",
  },
  director: {
    tone: "warm vinyl hiss, dust in lamplight, private without becoming solemn",
    rules: [
      "Use music as emotional weather, not revelation.",
      "Do not force grief disclosure or private memory.",
      "Let silence count as participation when the pair earns it.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "First track",
        event:
          "The first record starts with a song neither member knows but both recognize emotionally.",
        characterVisibleText:
          "The speakers crackle. The song has no lyrics, but it has a very specific opinion about restraint.",
        directorInstruction:
          "Invite a small reaction. The speaker can name the feeling without naming a wound.",
      },
      {
        atTurn: 16,
        title: "Skipped groove",
        event: "The record skips until one member answers the last question with less armor.",
        characterVisibleText:
          "The needle catches on the same soft chord. The booth waits with unacceptable patience.",
        directorInstruction:
          "Push for one cleaner answer, then move on before the room becomes therapy.",
      },
      {
        atTurn: 26,
        title: "House lights",
        event:
          "The house lights lift and the final record sleeve asks whether the booth can keep their names.",
        characterVisibleText:
          "The last sleeve has two blank lines where names could go. The pen is optional.",
        directorInstruction: "Let the pair choose privacy, ritual, or a grounded goodbye.",
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
