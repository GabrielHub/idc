import type { DateScenario } from "../../domain/game";

export const listeningBoothAfterClose: DateScenario = {
  id: "listening-booth-after-close",
  title: "Mum's The Word",
  card: {
    summary:
      "A record shop listening booth after closing. The music understands the room but keeps its mouth shut.",
    tags: ["haunted", "domestic", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 11,
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
    flow: "conversation",
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
        kind: "reveal",
        pitch:
          "Start the lyric-less track with a specific opinion about restraint. Surfaces a small reaction drawn from what either already shows.",
        beat: "The speakers crackle and the song starts. There are no lyrics. The track has a very specific opinion about restraint.",
        directorBeat:
          "Music just took a stance. Name the feeling without naming a wound, ask your date how it lands, sit with it until the chord changes, or comment on the restraint. Speak only from your existing register.",
      },
      {
        id: "listening-booth-after-close-event-2",
        title: "Skipped groove",
        kind: "provocation",
        pitch:
          "Catch the needle on the same soft chord and let it repeat. Forces one cleaner answer before the room becomes therapy.",
        beat: "The needle catches on the same soft chord and repeats it. The booth waits with unacceptable patience. The lamp does not flicker.",
        directorBeat:
          "The chord is stuck and the booth is waiting. Say the smaller honest thing you have been holding, lift the needle, ask your date what they hear, or break the loop with one move. Do not let it turn into therapy.",
      },
      {
        id: "listening-booth-after-close-event-3",
        title: "House lights",
        kind: "reveal",
        pitch:
          "Lift the booth lights a notch and slide a blank sleeve with two empty name lines onto the side table. Surfaces a choice: privacy, ritual, or a grounded goodbye.",
        beat: "The booth lights lift one notch. A blank record sleeve slides onto the side table. It has two empty lines where names could go. A pen rests beside it.",
        directorBeat:
          "An optional ritual just arrived. Sign the sleeve, ask your date if they want to, leave the pen alone, or comment on the empty lines. Make the small choice clearly.",
      },
      {
        id: "listening-booth-after-close-event-4",
        title: "Side flip",
        kind: "ambient",
        pitch:
          "Lift the tonearm on its own and flip the record to side B with a cleaner first chord. Surfaces stillness or restlessness without naming it.",
        beat: "The arm lifts on its own. The platter pauses, and the record turns over to side B. The lamp does not flicker. The first chord lands cleaner than the last side.",
        directorBeat:
          "The booth chose continuation for you. Settle into the new side, comment on the cleaner chord, glance at your date, or sit deeper. Show whether you are restless or steady.",
      },
      {
        id: "listening-booth-after-close-event-5",
        title: "Lamp dims",
        kind: "reveal",
        pitch:
          "Dim the bulb half a stop. Surfaces whether either reaches for a switch as a question.",
        beat: "The bulb in the booth's single lamp dims by half a stop. The dust in the light is now barely visible. The room does not feel emptier, only later.",
        directorBeat:
          "The booth is going later on you. Reach for the lamp switch, comment on the dust, settle into the shadow, or ask your date if they want more light. Speak from what you already carry.",
      },
      {
        id: "listening-booth-after-close-event-6",
        title: "Empty sleeve",
        kind: "ambient",
        pitch:
          "Slide a blank pencil-labeled sleeve into the discard bin among two others. Surfaces a small clearing without making it mean anything.",
        beat: "A blank sleeve slides itself into the discard bin beside the turntable. The label is in pencil and unreadable. The bin already has two sleeves in it.",
        directorBeat:
          "Something quiet got filed. Notice it, comment on the bin, look at your date, or stay with the music. Do not turn the discard into a metaphor.",
      },
      {
        id: "listening-booth-after-close-event-7",
        title: "Front door bell",
        kind: "ambient",
        pitch:
          "Chime the front door once down the hall with a soft good night from the back office. Surfaces presence inside the booth without making it a haunting.",
        beat: "The front door bell of the shop chimes once down the hall and stops. A back-office voice calls out a soft good night. The booth door stays closed.",
        directorBeat:
          "The outside world just brushed past. Acknowledge the goodnight to your date with a small line, return to the music, comment on the bell, or stay quiet. Do not voice the back office.",
      },
      {
        id: "listening-booth-after-close-event-8",
        title: "Stack settles",
        kind: "provocation",
        pitch:
          "Tilt the stack of unlabeled records a quarter inch with the lamp catching one spine. Forces a clean ending sentence.",
        beat: "The stack of unlabeled records on the side table tilts a quarter inch to one side. Nothing falls. The lamp catches the spine of the topmost sleeve.",
        directorBeat:
          "The room is offering you a closing line. Say the honest sentence you have been saving, pick the next record, ask your date one last question, or steady the stack. Wrap a beat cleanly.",
      },
      {
        id: "listening-booth-after-close-event-9",
        title: "Arm lifts",
        kind: "provocation",
        pitch:
          "Lift the tonearm mid-track and dim the lamp another notch. Forces a clean call: drop the needle back, set the arm at rest, or close out.",
        beat: "The tonearm lifts off the record mid-track and hangs above the rest. The platter slows but does not stop. The lamp dims one more notch.",
        directorBeat:
          "The booth is asking you to choose. Drop the needle back to keep going, set the arm at rest, or stand to leave. Say the call out loud.",
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
