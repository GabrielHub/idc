import type { DateScenario } from "../../domain/game";

export const dinerElevenPm: DateScenario = {
  id: "diner-eleven-pm",
  title: "Diner At Eleven",
  card: {
    summary:
      "Pancakes are available at all hours, and so are silences. One booth, vinyl seats, shared fries.",
    tags: ["food", "domestic", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 7,
    idealFor: [
      "members who close service jobs and recognize the carafe",
      "members whose overnight schedules put them in their right window",
      "members who are awake post-set and can sit through a long fries pass",
      "members whose warm steady voice handles a face-down check well",
    ],
    badFor: [
      "members who cannot extract leverage at a vinyl booth past eleven",
      "members who will film the booth and turn the carafe into b-roll",
      "members who cannot deliver a toast over a ketchup ramekin",
    ],
  },
  publicBrief: {
    location: "Booth 4 at Connie's, open since 1979",
    premise:
      "Cupid booked a late booth at a 24 hour diner. The waitress has worked here longer than either member has been online.",
    whatBothCharactersKnow:
      "Pancakes are at the breakfast section of the menu and are available now. Coffee is refilled without asking. Tipping is expected.",
    openingSituation:
      "Both members slide into a booth with cracks in the vinyl. Two laminated menus and a small jukebox tab sit on the table.",
  },
  director: {
    tone: "warm, slightly worn, lit by hanging pendant fixtures",
    rules: [
      "Honor late night honesty without forcing confession.",
      "The waitress is hands and a coffee carafe, not a comic device.",
      "Allow long silences. The booth can hold them.",
    ],
    events: [
      {
        id: "diner-eleven-pm-event-1",
        title: "Coffee refill",
        kind: "ambient",
        event: "The waitress passes with the carafe and tops both cups.",
        characterVisibleText:
          "Two cups are topped without comment. A small jug of half and half is centered. The carafe moves on to booth six.",
        directorInstruction:
          "Use the small mercy to lower the pair's guard. The waitress does not speak.",
      },
      {
        id: "diner-eleven-pm-event-2",
        title: "Shared plate",
        kind: "reveal",
        event: "A plate of fries lands between them.",
        characterVisibleText:
          "The fries arrive between them. There is one ramekin of ranch, one of ketchup. A second small plate is set on the side.",
        directorInstruction:
          "Allow eating to be the conversation for one beat. The shared plate surfaces small generosity or small holding back.",
      },
      {
        id: "diner-eleven-pm-event-3",
        title: "Last booth check",
        kind: "provocation",
        event: "A check is left face down at the edge of the table.",
        characterVisibleText:
          "The check sits face down at the edge of the booth. The waitress is already two booths away. The jukebox has gone quiet.",
        directorInstruction:
          "Push for one honest sentence before the booth ends. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "diner-eleven-pm-event-4",
        title: "Pie counter",
        kind: "reveal",
        event: "The pie-of-the-day card flips behind the counter.",
        characterVisibleText:
          "Behind the counter the pie-of-the-day flips from cherry to lemon meringue. The case is half full. A small label tape is curling on the cherry slot.",
        directorInstruction: "Use the small switch to surface a small honest preference.",
      },
      {
        id: "diner-eleven-pm-event-5",
        title: "Jukebox queues",
        kind: "reveal",
        event: "The booth jukebox tab queues a track no one selected.",
        characterVisibleText:
          "The small jukebox tab on the booth wall ticks over to track 117. No one fed it a quarter. The selection light blinks once.",
        directorInstruction:
          "Let the unfamiliar track sit. A member who names it shows their hand on a register they already carry.",
      },
      {
        id: "diner-eleven-pm-event-6",
        title: "Booth six pancakes",
        kind: "ambient",
        event: "Booth six orders a short stack at eleven thirty-eight.",
        characterVisibleText:
          "Two booths over, a man orders a short stack with bacon. He has a paperback and a half-finished coffee. The waitress writes it without looking down.",
        directorInstruction:
          "Allow the late hour to feel ordinary. The booth does not need to comment. Do not voice booth six.",
      },
      {
        id: "diner-eleven-pm-event-7",
        title: "Rain begins",
        kind: "ambient",
        event: "Rain starts against the diner window.",
        characterVisibleText:
          "Rain taps the diner window in soft uneven runs. The neon sign across the road blurs. The diner door opens and a damp couple takes booth two.",
        directorInstruction:
          "Use the weather to lower the room's pressure, not to underline it. Do not voice the booth two pair.",
      },
      {
        id: "diner-eleven-pm-event-8",
        title: "Carafe near",
        kind: "provocation",
        event: "The waitress drifts past with the carafe one more time.",
        characterVisibleText:
          "The waitress passes the booth with the carafe held low. She does not stop. A small look is offered and the carafe moves on to booth six.",
        directorInstruction:
          "Push for a small clean choice: another cup, the check, or a clean exit. The waitress does not speak.",
      },
      {
        id: "diner-eleven-pm-event-9",
        title: "Stool flip",
        kind: "provocation",
        event: "A counter stool gets flipped onto the counter at the far end.",
        characterVisibleText:
          "The cook flips one of the counter stools upside down onto the counter at the far end. The lights over the pie case dim by one notch. The carafe is on the warmer.",
        directorInstruction:
          "Push for a clean physical move: pay out, take the carafe pour, or call the booth done. The far counter is closing first. Do not voice any background person or cue as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the staff as scenery.",
      "A member uses the late hour as cover for a confession that asks more than the booth can hold.",
    ],
    repeatBehavior:
      "If repeated, the carafe arrives at booth four without a check first. The booth is held without paperwork.",
  },
  judgeRubric: {
    successSignals: [
      "The pair lets a silence land without flinching.",
      "A member treats the staff with respect on the way out.",
    ],
    failureSignals: [
      "A member performs sincerity instead of speaking it.",
      "The pair turns the booth into a confessional booth.",
    ],
    statFocus: ["trust", "chemistry", "relationshipHealth"],
  },
};
