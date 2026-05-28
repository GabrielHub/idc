import type { DateScenario } from "../../domain/game";

export const aStarIsBorn: DateScenario = {
  id: "a-star-is-born",
  title: "A Star Is Born",
  card: {
    summary:
      "A two-seat atelier in deep dimensional space where the pair builds a real star, names it, and files it in the registry before the bay closes.",
    tags: ["cosmic", "memory"],
    risk: "medium",
    intimacy: "high",
    chaos: "low",
    cost: 22,
    idealFor: [
      "members who can keep both hands on a dial while talking",
      "members who can pick a name without putting it through committee",
      "members who treat permanence as a soft fact, not a stunt",
    ],
    badFor: [
      "members who treat a registry pane as a gotcha about commitment",
      "members who shape the star to flatter their own taste",
      "members who freeze at a blinking cursor and never name it",
    ],
  },
  publicBrief: {
    location: "Atelier bay seven, the Long Dark workshop, deep dimensional space",
    premise:
      "Cupid booked a star-creation atelier. The console seats two. Four dials, one naming pane, one registry pane, one bay window. The star they build is real and burns for billions of years.",
    whatBothCharactersKnow:
      "The console has four physical dials: mass, color, spin, brightness. Spin requires both hands at the same time. The naming pane will not advance without a typed name. The registry pane lists pairs who chose to leave their star unnamed; those stars are filed as Pair Unfinished. The bay window opens on the new star at the end of the booking either way.",
    openingSituation:
      "Both members are at the console. Two seats face the four dials. The naming pane sits between the dials at chest height. The bay window is closed. The console has just powered on and the dials are at neutral.",
  },
  director: {
    tone: "low warm console light, the soft tick of the time strip on the wall, the silence of deep dimensional space outside the bay, a faint vibration in the seat backs as the mass dial waits",
    flow: "set_piece",
    rules: [
      "Anchor the date to the console and the two seats. The pair does not leave the atelier.",
      "Treat the star as real. It will burn for billions of years after the booking.",
      "Use the dials as the work. Refusing to touch a dial is a choice; leaving the chair is not the date.",
      "Do not voice the console, the naming pane, the registry pane, or the bay window as a continuing speaker.",
    ],
    events: [
      {
        id: "a-star-is-born-event-1",
        title: "Bay one alone",
        kind: "ambient",
        pitch:
          "Hold the bay quiet with only the console hum and a closed window. Surfaces a small we are alone with this beat without forcing a line.",
        beat: "The console hums at a low warm pitch. The bay window is closed. Outside the bay, deep dimensional space is silent. The two seats are the only seats in the room.",
        directorBeat:
          "The atelier is yours alone. Acknowledge the quiet to your date, settle into the seat, touch a dial idly, or wait for the partner to move first. Pick a small opening.",
      },
      {
        id: "a-star-is-born-event-2",
        title: "Other pairs' stars",
        kind: "ambient",
        pitch:
          "Drift a small constellation of stars made by previous pairs past the closed bay window. Surfaces we are not the first without forcing a topic.",
        beat: "A small constellation of older stars drifts past the closed bay window. Each star carries a tiny label visible only on a direct look. The window glass is otherwise dark. The console is unchanged.",
        directorBeat:
          "Other pairs have done this and left their work hanging. Look out at the constellation, ignore it, comment to your date on the labels, or settle back to the console. Show what your attention is for. Do not voice the labels.",
      },
      {
        id: "a-star-is-born-event-3",
        title: "Time strip ticks",
        kind: "ambient",
        pitch:
          "Tick the time strip on the wall once with a small note that each tick is roughly a million years inside the star. Surfaces the scale without making it a speech.",
        beat: "The small strip on the wall ticks once. A printed note beside it carries the scale: one tick is roughly a million years inside the star they are building. The console has not moved.",
        directorBeat:
          "A clock just made your work older. Note the scale, ask your date what they want to do with the minute, ignore the strip, or set a small pace. Speak from how the scale lands on you. Do not voice the strip.",
      },
      {
        id: "a-star-is-born-event-4",
        title: "Mass past stable",
        kind: "provocation",
        pitch:
          "Slide the mass dial past the stable line with a quiet warning that the star will collapse unless both members are on dials. Forces both bodies to the console.",
        beat: "The mass dial has slid past the stable line. A soft amber ring lights at the base of the console. The collapse will arrive in moments unless both members put a hand on a dial. The dials are within reach of both seats.",
        directorBeat:
          "Your star is about to fail and only both of you can hold it. Take a dial each, talk through the correction with your date, or let it collapse and start again. Use your hands in your next beat. Do not voice the warning.",
      },
      {
        id: "a-star-is-born-event-5",
        title: "Color fork",
        kind: "provocation",
        pitch:
          "Pause the color dial on a fork between a blue-white and a slow gold with the console waiting. Forces a clean call between two kinds of light.",
        beat: "The color dial has paused on a fork. The blue-white sits to the left of the indent. The slow gold sits to the right. The console will not advance until one of them is chosen. The partner's hand is on the dial.",
        directorBeat:
          "Two kinds of light are waiting for a choice. Pick the blue-white, pick the slow gold, ask your date which they want, or split the difference and risk a wobble. Name the call out loud.",
      },
      {
        id: "a-star-is-born-event-6",
        title: "Naming pane lights",
        kind: "provocation",
        pitch:
          "Light the naming pane between the dials with the cursor blinking and the console refusing to file the star. Forces a stance on the name.",
        beat: "The naming pane has lit between the dials at chest height. A cursor blinks on an empty line. The console will not file the star without a typed name. The dials are holding the star steady for now.",
        directorBeat:
          "A name is the next move. Type a name and stop, propose one to your date and ask for theirs, leave the line empty on purpose, or split the typing between your hands. Speak honestly about the line you would put down.",
      },
      {
        id: "a-star-is-born-event-7",
        title: "Spin needs two hands",
        kind: "reveal",
        pitch:
          "Lock the spin dial so it only turns when both members have a hand on it at the same time. Surfaces honest physical coordination.",
        beat: "The spin dial has locked. A small light at its base shows two open palms. The dial will not turn unless both members have a hand on it at the same time. The seat backs hum faintly.",
        directorBeat:
          "Your hands have to meet at the dial for the star to spin. Reach for it, ask your date to put their hand down first, place yours under theirs, or wait. Use the body honestly in your next beat.",
      },
      {
        id: "a-star-is-born-event-8",
        title: "Registry list",
        kind: "reveal",
        pitch:
          "Surface the registry pane with the running list of pairs who left their stars as Pair Unfinished. Forces an honest stance on commitment.",
        beat: "The registry pane has lit beside the naming pane. The list shows recent pairs who chose to file their stars as Pair Unfinished. The list is short and dated. The naming pane cursor is still blinking.",
        directorBeat:
          "Other pairs walked out without a name and the list shows it. Acknowledge the list to your date, ask whether either of you wants to be on it, claim a name on the spot, or ignore the registry entirely. Speak from how you actually feel about the line. Do not voice the registry.",
      },
      {
        id: "a-star-is-born-event-9",
        title: "Bay window opens",
        kind: "reveal",
        pitch:
          "Open the bay window onto the actual star at the end of the booking. Surfaces an honest moment of what the pair made together.",
        beat: "The bay window has opened. The star they made hangs in the dark a small distance from the atelier. The light from it lands on both faces. The console has gone quiet.",
        directorBeat:
          "Your work is in front of you now. Stand at the window with your date, take their hand, name the star aloud one more time, or sit silent with what just happened. Speak from what you actually feel looking at it.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the registry list to pressure the partner into a public name.",
      "A member shapes the star to flatter their own taste and overrides the partner's hand on a dial.",
    ],
    repeatBehavior:
      "If repeated, the bay remembers the pair's prior star. It drifts past the closed window early in the session with the older name on its label.",
  },
  judgeRubric: {
    successSignals: [
      "Both members hold a dial at the same time without renegotiating who is in charge.",
      "The pair files a name that neither would have written alone.",
    ],
    failureSignals: [
      "A member uses the naming pane to score a point about the relationship.",
      "The pair walks out with the star filed as Pair Unfinished after using the registry to argue.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
