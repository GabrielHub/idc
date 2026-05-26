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
        pitch:
          "Top both cups silently and let the carafe move on. Surfaces whether either lets the small mercy lower their guard.",
        beat: "Two cups are topped without comment. A small jug of half and half is centered. The carafe moves on to booth six.",
        directorBeat:
          "Coffee just got better without anyone asking. Notice it, push the half and half across, sip and let the warmth land, or comment to your date on the refill. Do not voice the waitress.",
      },
      {
        id: "diner-eleven-pm-event-2",
        title: "Shared plate",
        kind: "reveal",
        pitch:
          "Land fries between you with two ramekins and an extra plate on the side. Surfaces small generosity or quiet holding back.",
        beat: "The fries arrive between them. There is one ramekin of ranch, one of ketchup. A second small plate is set on the side.",
        directorBeat:
          "A shared plate just landed. Pick the ranch, push the ketchup across, claim the second plate, or wait for your date to start. Eat or hold back in a visible way.",
      },
      {
        id: "diner-eleven-pm-event-3",
        title: "Last booth check",
        kind: "provocation",
        pitch:
          "Set the check face down at the booth's edge with the jukebox quiet. Forces one honest sentence before the booth ends.",
        beat: "The check sits face down at the edge of the booth. The waitress is already two booths away. The jukebox has gone quiet.",
        directorBeat:
          "The night is being handed back to you. Reach for the check, ask your date if they want one more, say something honest you have been saving, or pay and stand. Move the moment forward. Do not voice the waitress.",
      },
      {
        id: "diner-eleven-pm-event-4",
        title: "Pie counter",
        kind: "reveal",
        pitch:
          "Flip the pie-of-the-day from cherry to lemon meringue behind the counter. Surfaces a small honest preference.",
        beat: "Behind the counter the pie-of-the-day flips from cherry to lemon meringue. The case is half full. A small label tape is curling on the cherry slot.",
        directorBeat:
          "The pie just changed on you. Comment on which you wanted, ask your date which they would order, get up and look at the case, or skip it. Show a small honest taste.",
      },
      {
        id: "diner-eleven-pm-event-5",
        title: "Jukebox queues",
        kind: "reveal",
        pitch:
          "Tick the booth jukebox to track 117 without a coin. Surfaces a stance drawn only from what either already carries.",
        beat: "The small jukebox tab on the booth wall ticks over to track 117. No one fed it a quarter. The selection light blinks once.",
        directorBeat:
          "A song just queued itself. Name the track if you know it, comment on the free play, ask your date what they hope it is, or let it sit. Speak only from a register you already carry.",
      },
      {
        id: "diner-eleven-pm-event-6",
        title: "Booth six pancakes",
        kind: "ambient",
        pitch:
          "Order a short stack and bacon two booths over at eleven thirty-eight. Surfaces whether the pair lets the late hour feel ordinary.",
        beat: "Two booths over, a man orders a short stack with bacon. He has a paperback and a half-finished coffee. The waitress writes it without looking down.",
        directorBeat:
          "Someone is settling in for the long haul. Notice it, comment on the order, mirror it by ordering something yourself, or let the room hum. Show how late-night company sits with you. Do not voice booth six.",
      },
      {
        id: "diner-eleven-pm-event-7",
        title: "Rain begins",
        kind: "ambient",
        pitch:
          "Tap rain against the window and bring a damp couple into booth two. Surfaces a small lowering of pressure.",
        beat: "Rain taps the diner window in soft uneven runs. The neon sign across the road blurs. The diner door opens and a damp couple takes booth two.",
        directorBeat:
          "The night just got softer outside. Comment on the rain, watch the new pair settle in, glance at the neon blur, or stay on your date. Let the weather lower the heat. Do not voice booth two.",
      },
      {
        id: "diner-eleven-pm-event-8",
        title: "Carafe near",
        kind: "provocation",
        pitch:
          "Drift the waitress past the booth with the carafe held low and a small offered look. Forces a clean choice on another cup or the check.",
        beat: "The waitress passes the booth with the carafe held low. She does not stop. A small look is offered and the carafe moves on to booth six.",
        directorBeat:
          "You just got an offer without a word. Wave her back for another cup, ask for the check, propose to your date that you stay or go, or let her keep walking. Make the small call. Do not voice the waitress.",
      },
      {
        id: "diner-eleven-pm-event-9",
        title: "Stool flip",
        kind: "provocation",
        pitch:
          "Flip a counter stool up at the far end and dim the pie case by one notch. Forces a clean physical move on paying out or staying.",
        beat: "The cook flips one of the counter stools upside down onto the counter at the far end. The lights over the pie case dim by one notch. The carafe is on the warmer.",
        directorBeat:
          "The diner is starting to close around you. Pay the check, take one last pour, propose the next stop, or stand and walk out together. Move the body, not just the words. Do not voice the cook.",
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
