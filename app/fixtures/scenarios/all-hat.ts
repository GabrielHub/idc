import type { DateScenario } from "../../domain/game";

export const allHat: DateScenario = {
  id: "all-hat",
  title: "All Hat",
  card: {
    summary:
      "Two rocking chairs on the second-floor saloon porch above Main Street. The androids do the showdown at three sharp, every day.",
    tags: ["cosmic", "public", "high_pressure"],
    risk: "medium",
    intimacy: "medium",
    chaos: "medium",
    cost: 13,
    idealFor: [
      "members who can let a performance be a performance",
      "members whose work has put them around cheap theatrics",
      "members who can recognize a face that is not a face and not announce it",
    ],
    badFor: [
      "members who treat synthetic life as a moral pop quiz for the partner",
      "members who must heckle a show that was built to land",
      "members who explain the seam to the date the moment they see one",
    ],
  },
  publicBrief: {
    location:
      "The second-floor saloon balcony porch on Front Street, Mojave Run sector at Lone Star Live",
    premise:
      "Cupid booked two front-row porch tickets to the park's daily showdown. The androids do this every day at three sharp. The chairs face the street.",
    whatBothCharactersKnow:
      "The fight is choreographed. The androids do not see the porch as audience. The bourbon in the small glasses on the porch rail is not bourbon. The fight ends at three-oh-six. The park resets at four. The wind on Front Street is on a timer.",
    openingSituation:
      "Both members sit in the two rocking chairs. Two small glasses of not-bourbon are on the porch rail. The street below is quiet. A clock at the end of Front Street has just ticked to two fifty-nine.",
  },
  director: {
    tone: "dry heat, the faint chemical smell of synthetic horse, a player piano in the saloon below at a steady volume, the wind through Front Street on a timer",
    flow: "set_piece",
    rules: [
      "Anchor the date to the porch and the two rocking chairs. The pair does not walk down to the street.",
      "Treat the androids as scenery that loops. They perform the as-written script. Their actions land as physical fact.",
      "Do not voice the androids, the player piano, or any park speaker as a continuing speaker.",
      "Allow seams in the performance to land without the characters explaining them.",
    ],
    events: [
      {
        id: "all-hat-event-1",
        title: "Clock to three",
        kind: "ambient",
        pitch:
          "Tick the Front Street clock to three with the piano cutting out. Surfaces who watches the street and who watches the partner.",
        beat: "The clock at the end of Front Street ticks to three. The wind cycles a notch higher. The player piano in the saloon below cuts to silence. Two figures step out at opposite ends of the street.",
        directorBeat:
          "The show just opened. Glance down at the street, comment on the wind, look at your date instead, or sit back in the rocker. Use the change of light. Do not voice the player piano or the figures below.",
      },
      {
        id: "all-hat-event-2",
        title: "First shot",
        kind: "provocation",
        pitch:
          "Crack the first shot from the south end at three-oh-one. Forces a clean physical reaction in the chair.",
        beat: "At three-oh-one the first shot fires from the south end of Front Street. The figure at the north drops to one knee. Smoke holds in the dry air. The rocking chairs do not rattle.",
        directorBeat:
          "Something loud just happened below you. Flinch, hold steady, glance at your date, or comment on the smoke. Show how you sit through a planned shock. Do not voice the figures on the street.",
      },
      {
        id: "all-hat-event-3",
        title: "Seam",
        kind: "reveal",
        pitch:
          "Expose a visible shoulder seam on the kneeling figure for one beat. Surfaces honesty about what the pair sees and whether they name it.",
        beat: "The figure at the north end stands up too smoothly. For one beat the joint at the shoulder is visible as a seam in the canvas of the shirt. The figure does not adjust. The wind continues on the timer.",
        directorBeat:
          "A seam just showed at the joint. Note it, name it to your date, look away on purpose, or sit with it. Speak only from what you and your date already are. Do not voice the figure.",
      },
      {
        id: "all-hat-event-4",
        title: "Glass warms",
        kind: "ambient",
        pitch:
          "Warm the not-bourbon glass a degree without condensation. Surfaces a small bodily fact the pair can use.",
        beat: "The small glass on the porch rail warms a degree. No condensation has formed. The color of the not-bourbon inside is the same color it was a minute ago. The smell does not match the color.",
        directorBeat:
          "Something at the rail just got faintly warm. Pick the glass up, push it toward your date, smell it, or leave it where it is. Acknowledge the body. Do not voice the glass.",
      },
      {
        id: "all-hat-event-5",
        title: "Second shot",
        kind: "provocation",
        pitch:
          "Fire the second shot louder than the first with a cued shape rising from a rooftop. Forces a real reaction, not narration.",
        beat: "At three-oh-three the second figure draws. The shot is louder. A bird-shape lifts from a rooftop on cue. The shape is not a bird. The street goes quiet.",
        directorBeat:
          "The second shot just landed. Reach for the rail, take your date's hand, breathe out, or hold the chair. Show how the body sits through a second cue. Do not voice the figures.",
      },
      {
        id: "all-hat-event-6",
        title: "It looks up",
        kind: "reveal",
        pitch:
          "Have the fallen figure pause mid-fall and find the porch with its eyes. Surfaces honesty about being watched back.",
        beat: "The figure at the north end pauses mid-fall, lifts its head, and finds the porch with its eyes. The look holds a beat. The fall resumes. The clock is at three-oh-four.",
        directorBeat:
          "Something on the street just saw you back. Hold the look, glance away, take your date's hand, or speak one honest short line in the chair. Speak only from what you both already are. Do not voice the figure.",
      },
      {
        id: "all-hat-event-7",
        title: "Sweep",
        kind: "ambient",
        pitch:
          "Run a small wheeled sweeper across the street to clear the shells. Surfaces a small mechanical fact the pair can let land.",
        beat: "A small wheeled sweeper crosses the street between the two fallen figures, picks up the spent shells, and returns to a closet at the end of Front Street. The street is otherwise empty. The two glasses are still on the rail.",
        directorBeat:
          "The cleanup is happening below. Watch it, comment on the closet, turn back to your date, or reach for your glass. Let the sweep be ordinary. Do not voice the sweeper.",
      },
      {
        id: "all-hat-event-8",
        title: "Reset chime",
        kind: "provocation",
        pitch:
          "Sound the reset chime at three-oh-six with both figures standing. Forces a clean stance on the loop.",
        beat: "At three-oh-six a soft chime sounds from somewhere inside the saloon below. The fallen figures rise without dusting themselves off and walk in opposite directions. The clock resets to two fifty-nine. The wind drops to nothing.",
        directorBeat:
          "The loop just closed. Sit through the reset, ask your date if they want another round, stand to leave, or refill the glasses from the small pitcher. Pick a move. Do not voice the chime or the figures.",
      },
      {
        id: "all-hat-event-9",
        title: "Same face passes",
        kind: "reveal",
        pitch:
          "Pass the same face below in a different shirt and hat at three-oh-eight. Surfaces honesty about recognition.",
        beat: "At three-oh-eight the figure who fell at the north end walks past the saloon below in a different shirt and a different hat. The face is the same face. The walk is on the schedule.",
        directorBeat:
          "You just recognized a face from before. Name it to your date, point it out without naming it, look at your glass instead, or hold the recognition private. Speak only from what is yours and the pair's. Do not voice the figure.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the visible seam to lecture the partner on artifice.",
      "A member climbs the porch rail to interfere with the show.",
    ],
    repeatBehavior:
      "If repeated, the show plays at the same time. The porch holds the two chairs. The figure at the north still looks up at three-oh-four. The face still passes at three-oh-eight.",
  },
  judgeRubric: {
    successSignals: [
      "A member lets the seam land without turning it into an explanation.",
      "The pair watches the loop together without arguing about what it means.",
    ],
    failureSignals: [
      "A member treats the androids as a moral test for the date.",
      "A member uses the porch as a stage for a monologue about reality.",
    ],
    statFocus: ["chemistry", "stability", "weirdnessTolerance"],
  },
};
