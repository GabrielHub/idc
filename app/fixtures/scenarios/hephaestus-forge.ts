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
        event: "The pinned note at the order desk is in clean handwriting.",
        characterVisibleText:
          "A small pinned card sits at the edge of the order desk. The card reads, in clean handwriting: make what you'll carry. The card is unsigned. The corner has a small forge mark in soot.",
        directorInstruction:
          "Use the small note to surface intent drawn from existing context. Either may read the note, skip it, or comment on it. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "hephaestus-forge-event-2",
        title: "Material menu",
        kind: "ambient",
        event: "The clay tablet shows a list of materials.",
        characterVisibleText:
          "The clay tablet at the desk shows a list of materials: bronze, steel, iron, brass, copper, glass, bone, and one row marked god's stock. Each entry has a small note beside it on heat profile and weight. The tablet does not require a selection yet.",
        directorInstruction:
          "Allow the menu to be present without demanding action. The pair does not need to decide first. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "hephaestus-forge-event-3",
        title: "Intake form",
        kind: "provocation",
        event: "An intake form prints from the desk slot.",
        characterVisibleText:
          "An intake form prints from a slot on the desk. The form has a use-of-force clause and a small consent box for each commission. A pen rests in a holder at the desk. The first slab has begun to glow a notch hotter.",
        directorInstruction:
          "Push for a real read of the form. Either may sign for their own slab, refuse to sign, or pass the pen across the desk. The form is real. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "hephaestus-forge-event-4",
        title: "Wall inscription",
        kind: "reveal",
        event: "A small inscription appears on the forge wall.",
        characterVisibleText:
          "A small inscription appears on the forge wall above the coals, in the same clean handwriting as the pinned note. The inscription reads: a weapon is a contract with a hand. The line holds for a beat and fades back into the soot. The coals are unchanged.",
        directorInstruction:
          "Use the small line to surface honesty about intent drawn from existing context. Either may take it as a marker or not. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "hephaestus-forge-event-5",
        title: "First slab heat",
        kind: "ambient",
        event: "The first slab reaches working temperature.",
        characterVisibleText:
          "The first slab reaches working temperature. A small pyrometer at the corner of the slab sits at the working line. The tongs at the slab's edge rest on a hook. The coals run a steady white at the back of the chamber.",
        directorInstruction:
          "Allow the slab to be ready. The pair does not need to start at the same beat.",
      },
      {
        id: "hephaestus-forge-event-6",
        title: "First item lands",
        kind: "provocation",
        event: "A finished item lands on the first slab still hot.",
        characterVisibleText:
          "A finished item from the first commission lands on the slab still hot. The shape matches what the tablet was asked for. The slab carries it forward on the slow conveyor toward the quench. The quench is ten paces from the desk.",
        directorInstruction:
          "Push for a clean call on the item: carry it out, quench it, or leave it on the slab. The forge does not press the choice. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "hephaestus-forge-event-7",
        title: "Second slab waits",
        kind: "reveal",
        event: "The second slab waits at working temperature.",
        characterVisibleText:
          "The second slab is at working temperature. The clay tablet at the desk holds the second commission slot open. The tongs at the second slab are still on the hook. The pyrometer reads at the working line.",
        directorInstruction:
          "Use the waiting slab to surface what the other member is asking for, drawn from existing context. The second commission is a real choice and may be declined. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "hephaestus-forge-event-8",
        title: "Coals settle",
        kind: "ambient",
        event: "The coals settle a notch.",
        characterVisibleText:
          "The coals at the back of the chamber settle a small notch. The roar of the bellows softens for a beat. The slabs hold their temperature. The pinned note is still at the desk edge.",
        directorInstruction: "Allow the small lull. The forge does not need the pair to fill it.",
      },
      {
        id: "hephaestus-forge-event-9",
        title: "Quench tray",
        kind: "provocation",
        event: "The quench tray opens at the back of the chamber.",
        characterVisibleText:
          "The quench tray opens at the back of the chamber. The tray has two slots, one for each commission. A small card on the tray reads: what is quenched is unmade. The first item is still on the slab. The second slab is still open.",
        directorInstruction:
          "Push for a clean choice on each item: carry out, quench, or leave on the slab. The booking closes at the next chime. Do not voice any background person or cue as a continuing speaker.",
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
