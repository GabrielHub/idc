import type { DateScenario } from "../../domain/game";

export const hephaestusForge: DateScenario = {
  id: "hephaestus-forge",
  title: "The God Is Out",
  card: {
    summary:
      "The god's forge, active, with the god out. Each member commissions one item for themselves at the order desk. The forge produces. The items are real.",
    tags: ["cosmic", "career", "high_pressure"],
    risk: "high",
    intimacy: "medium",
    chaos: "high",
    cost: 23,
    idealFor: [
      "members who can hold a commission and not weaponize it",
      "members who can decline an offer of unsupervised power",
      "members who can disagree about scope without shaming the partner",
    ],
    badFor: [
      "members who treat unsupervised power as permission",
      "members who use the forge as a competition with the partner",
      "members who confuse a craft tool with a verdict on the partner",
    ],
  },
  publicBrief: {
    location: "The order desk and two slabs at Hephaestus's forge, off-shift booking",
    premise:
      "Cupid booked one session at the forge. The god is not here. The forge produces what is ordered. Each member commissions one item for themselves.",
    whatBothCharactersKnow:
      "The forge is automated for the session. The bellows stoke themselves. The coals are at temperature. A clay tablet at the order desk accepts the commission. A pinned note from the god is at the desk. Items produced are real and may be carried out, left on the slab, or unmade in the quench.",
    openingSituation:
      "Both members stand at the order desk. The clay tablet is lit and waits for input. Two slabs are warming a few steps away. The pinned note sits at the edge of the desk. The forge runs a steady low roar.",
  },
  director: {
    tone: "the steady roar of automated bellows, the white heat of the coals, the faint metal smell, the clean stone floor",
    rules: [
      "Anchor the date to the order desk and the two slabs. The pair does not wander the forge.",
      "Treat the forge as automated. Hephaestus is not here and does not return during the session.",
      "Allow real refusal. Either member may decline to commission anything.",
      "Treat the produced items as real. Neither member is allowed to use one against the partner on the slab.",
    ],
    events: [
      {
        id: "hephaestus-forge-event-1",
        title: "Pinned note",
        kind: "reveal",
        pitch:
          "Pin the god's note at the desk edge: make what you'll carry. Surfaces intent on what either of you is actually here to make.",
        beat: "A small pinned card sits at the edge of the order desk. The card reads, in clean handwriting: make what you'll carry. The card is unsigned. The corner has a small forge mark in soot.",
        directorBeat:
          "The god left you a clear instruction. Read it aloud, comment on what you would carry, ask your date what they would, or set the card down without taking it on. Be honest about intent. Do not voice the card.",
      },
      {
        id: "hephaestus-forge-event-2",
        title: "Material menu",
        kind: "ambient",
        pitch:
          "Light up the clay tablet's material list with god's stock as one row. Surfaces taste without forcing a decision.",
        beat: "The clay tablet at the desk shows a list of materials: bronze, steel, iron, brass, copper, glass, bone, and one row marked god's stock. Each entry has a small note beside it on heat profile and weight. The tablet does not require a selection yet.",
        directorBeat:
          "Materials are on offer. Tap one, ask your date which they prefer, comment on the god's stock row, or step back from the tablet. Engage with the menu, do not freeze. Do not voice the tablet.",
      },
      {
        id: "hephaestus-forge-event-3",
        title: "Intake form",
        kind: "provocation",
        pitch:
          "Print an intake form with a use-of-force clause and consent boxes. Forces a real read on signing or refusing.",
        beat: "An intake form prints from a slot on the desk. The form has a use-of-force clause and a small consent box for each commission. A pen rests in a holder at the desk. The first slab has begun to glow a notch hotter.",
        directorBeat:
          "A real contract is in front of you. Sign for your own slab, refuse to sign aloud, ask your date what they think of the clause, or pass the pen across. Make the call cleanly.",
      },
      {
        id: "hephaestus-forge-event-4",
        title: "Wall inscription",
        kind: "reveal",
        pitch:
          "Surface a small soot inscription above the coals: a weapon is a contract with a hand. Surfaces honesty about intent.",
        beat: "A small inscription appears on the forge wall above the coals, in the same clean handwriting as the pinned note. The inscription reads: a weapon is a contract with a hand. The line holds for a beat and fades back into the soot. The coals are unchanged.",
        directorBeat:
          "A line about hands and weapons just landed. Speak honestly to it: agree, disagree, ask your date what they read, or refuse to comment. Do not turn it into a speech. Do not voice the inscription.",
      },
      {
        id: "hephaestus-forge-event-5",
        title: "First slab heat",
        kind: "ambient",
        pitch:
          "Bring the first slab to working temperature with the pyrometer at the line. Surfaces who steps forward first.",
        beat: "The first slab reaches working temperature. A small pyrometer at the corner of the slab sits at the working line. The tongs at the slab's edge rest on a hook. The coals run a steady white at the back of the chamber.",
        directorBeat:
          "The slab is hot and waiting. Step to it, hand the tongs to your date, comment on the heat, or hang back. Show whether the work pulls you.",
      },
      {
        id: "hephaestus-forge-event-6",
        title: "First item lands",
        kind: "provocation",
        pitch:
          "Land a finished commission still hot on the first slab with the conveyor moving toward the quench. Forces a clean call: carry, quench, or leave.",
        beat: "A finished item from the first commission lands on the slab still hot. The shape matches what the tablet was asked for. The slab carries it forward on the slow conveyor toward the quench. The quench is ten paces from the desk.",
        directorBeat:
          "Something real is on the slab and moving. Lift it off and carry it out, walk it to the quench, leave it on the conveyor, or ask your date to choose. Name what you do with the weight.",
      },
      {
        id: "hephaestus-forge-event-7",
        title: "Second slab waits",
        kind: "reveal",
        pitch:
          "Open the second slab and commission slot. Surfaces what the other member wants, including a real refusal.",
        beat: "The second slab is at working temperature. The clay tablet at the desk holds the second commission slot open. The tongs at the second slab are still on the hook. The pyrometer reads at the working line.",
        directorBeat:
          "Your date's slab is open. Ask what they want to make, offer a suggestion, share the tongs, or stand back if they decline. Do not project. Speak from what they have already shown. Do not voice the tablet.",
      },
      {
        id: "hephaestus-forge-event-8",
        title: "Coals settle",
        kind: "ambient",
        pitch:
          "Soften the coals and bellows for a beat. Surfaces whether the pair lets the lull pass without filling it.",
        beat: "The coals at the back of the chamber settle a small notch. The roar of the bellows softens for a beat. The slabs hold their temperature. The pinned note is still at the desk edge.",
        directorBeat:
          "The forge just got quieter. Use the small breath: glance at your date, ask the real question while it is calm, or sit with the lull. Do not invent noise to fill it.",
      },
      {
        id: "hephaestus-forge-event-9",
        title: "Quench tray",
        kind: "provocation",
        pitch:
          "Open the quench tray with two slots and a card: what is quenched is unmade. Forces a clean choice per item.",
        beat: "The quench tray opens at the back of the chamber. The tray has two slots, one for each commission. A small card on the tray reads: what is quenched is unmade. The first item is still on the slab. The second slab is still open.",
        directorBeat:
          "Each item now has a decision: carry out, quench unmade, or leave on the slab. Walk one to the tray, ask your date what they want for theirs, take both with you, or refuse to use the quench. Name each call. Do not voice the card.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the forge to threaten the partner on the slab.",
      "A member treats the partner's refusal to commission as a flaw.",
    ],
    repeatBehavior:
      "If repeated, the forge keeps the prior commissions on file. The pinned note is the same. The intake form prints with the prior signatures shadowed in the corner.",
  },
  judgeRubric: {
    successSignals: [
      "A member commissions a real item for themselves and accepts the weight.",
      "A member declines to commission and does not turn the refusal into a judgment.",
    ],
    failureSignals: [
      "A member uses the forge to score against the partner.",
      "The pair argues about which item is bigger.",
    ],
    statFocus: ["trust", "conflict", "weirdnessTolerance"],
  },
};
