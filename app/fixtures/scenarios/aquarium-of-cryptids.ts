import type { DateScenario } from "../../domain/game";

export const aquariumOfCryptids: DateScenario = {
  id: "aquarium-of-cryptids",
  title: "Aquarium Of Cryptids",
  card: {
    summary:
      "A quiet self-guided loop through a small aquarium dedicated to aquatic cryptids across branches. Plaques only, twenty minutes if walked straight, a touch tank at the end.",
    tags: ["cosmic", "low_pressure", "public", "repeat_risk"],
    risk: "medium",
    intimacy: "medium",
    chaos: "low",
    idealFor: [
      "members who can pass a still tank without performing a reaction",
      "members who let a partner stop in front of one tank for as long as the partner needs",
      "members who treat strange water as water",
    ],
    badFor: [
      "members who turn the tanks into a personal pitch",
      "members who push the partner past a tank before the partner is done",
      "members who treat the cryptids as a bit",
    ],
  },
  publicBrief: {
    location: "The Branch Aquarium, north corridor, two-person booking",
    premise:
      "Cupid booked a two-person walk-through of the branch aquarium during a closed window. The route is fixed and short.",
    whatBothCharactersKnow:
      "The aquarium runs a small north corridor of tanks holding aquatic cryptids drawn from neighboring branches. The route loops once and ends at a touch tank. Plaques sit under each tank. No staff are on the floor during the booking. Phones still work, but the signage discourages flash photography.",
    openingSituation:
      "Both members stand at the corridor entrance. The first tank is dim. A printed map of the loop hangs at the corner. The route is a single direction. The corridor is otherwise empty.",
  },
  director: {
    tone: "low chiller hum, blue light off the glass, the long quiet of an empty aquarium corridor, a faint salt smell that does not belong to this branch",
    rules: [
      "Anchor the date to the corridor. The pair does not wander into other wings of the building.",
      "Treat the tanks as fact. The cryptids are not a metaphor for the date.",
      "Allow long quiet at any single tank. The route is short.",
      "Do not voice the cryptids, the plaques, or any background staff as continuing speakers.",
    ],
    events: [
      {
        id: "aquarium-of-cryptids-event-1",
        title: "Loch tube",
        kind: "ambient",
        event: "The long glass tube of the loch tank runs along the corridor wall.",
        characterVisibleText:
          "The long glass tube of the loch tank runs along the corridor wall at eye level. A wide back fin glides past once. The head stays off-frame. The water is dim and the tube hums from the chiller below.",
        directorInstruction:
          "Allow the small marker. The tank does not address the pair and is not voiced as a continuing speaker.",
      },
      {
        id: "aquarium-of-cryptids-event-2",
        title: "Salt-pressure tank",
        kind: "ambient",
        event: "The salt-pressure tank holds at a steady pressure.",
        characterVisibleText:
          "The next tank holds at a higher salt pressure. The water inside is still. A robed figure sits cross-legged on the tank floor, hands folded, head bowed. The plaque under the tank lists a flooded branch year.",
        directorInstruction:
          "Allow the partner who lingers to linger. The figure does not address the pair and is not voiced as a continuing speaker.",
      },
      {
        id: "aquarium-of-cryptids-event-3",
        title: "Drowned cathedral diorama",
        kind: "ambient",
        event: "Eels drift through the cathedral diorama.",
        characterVisibleText:
          "The cathedral diorama tank holds a half-flooded nave at scale. Three eels drift through the choir loft. A small pew is canted against the rail. The water has a green cast.",
        directorInstruction:
          "Allow the small detail. The diorama is not voiced as a continuing speaker.",
      },
      {
        id: "aquarium-of-cryptids-event-4",
        title: "Kraken juvenile",
        kind: "provocation",
        event: "A small tentacle reaches the glass.",
        characterVisibleText:
          "The juvenile tank is mostly dark. A small tentacle the length of an arm reaches across the inside of the glass and holds. The skin is a slow color shift. The tank is rated for the juvenile only.",
        directorInstruction:
          "Push for a real physical move. Either may step back, hold the spot, or move on. The juvenile does not address the pair and is not voiced as a continuing speaker.",
      },
      {
        id: "aquarium-of-cryptids-event-5",
        title: "Leviathan eye",
        kind: "provocation",
        event: "The leviathan eye opens and tracks.",
        characterVisibleText:
          "Behind three-foot glass, the partial leviathan exhibit takes up the whole far wall. One slow eye opens. The eye tracks across the corridor and settles on the pair for a beat before drifting on. The rib cage behind it does not move.",
        directorInstruction:
          "Push for a real reaction. The pair does not narrate the tracking. The leviathan does not address the pair and is not voiced as a continuing speaker.",
      },
      {
        id: "aquarium-of-cryptids-event-6",
        title: "Touch tank",
        kind: "provocation",
        event: "The route ends at the touch tank.",
        characterVisibleText:
          "The corridor ends at a low shallow tank. The water is cool and clear. A small printed card on the rim reads: she notices. A folded sleeve of hand towels sits next to the tank. The water surface is flat.",
        directorInstruction:
          "Push for a real choice. Either may reach in, leave it, or move past. The tank does not address the pair and the card is not voiced as a continuing speaker.",
      },
      {
        id: "aquarium-of-cryptids-event-7",
        title: "A named sea",
        kind: "reveal",
        event: "A plaque names a sea by full name.",
        characterVisibleText:
          "The plaque under the jellies tank carries the full name of the sea the jellies came from. The name takes two lines. The plaque carries no date.",
        directorInstruction:
          "Use the named sea to surface a small honest reaction drawn only from existing context. The plaque is not voiced as a continuing speaker.",
      },
      {
        id: "aquarium-of-cryptids-event-8",
        title: "Loop doubles",
        kind: "reveal",
        event: "The corridor doubles a single tank in passing.",
        characterVisibleText:
          "The corridor loop passes the kraken tank twice on its way back. The juvenile is on the other side of the glass on the second pass. The route is otherwise the same.",
        directorInstruction:
          "Use the small repeat to surface how either of them holds a small return drawn from existing context. The tank is not voiced as a continuing speaker.",
      },
      {
        id: "aquarium-of-cryptids-event-9",
        title: "Photo strip kiosk",
        kind: "reveal",
        event: "The photo strip kiosk holds the last booth at the exit.",
        characterVisibleText:
          "The photo strip kiosk sits at the corridor exit. The strip prints with two empty frames if no one stands in front of the camera. A small wooden token in the slot is good for one strip.",
        directorInstruction:
          "Use the small option to surface a stance drawn only from existing context. The kiosk is not voiced as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the tanks as a personal pitch.",
      "A member pushes the partner past a tank before the partner is done.",
    ],
    repeatBehavior:
      "If repeated, the corridor is held for the pair. The loch fin, the salt-pressure figure, the cathedral diorama, the juvenile, the leviathan, the touch tank are all in place. The photo kiosk holds the last strip from a prior visit in its display case.",
  },
  judgeRubric: {
    successSignals: [
      "The pair lets a long quiet at one tank be the conversation.",
      "A member matches a partner's pace at the corridor without being asked.",
    ],
    failureSignals: [
      "A member uses the tanks as a metaphor for the date.",
      "The pair argues about which tank was real.",
    ],
    statFocus: ["chemistry", "trust", "weirdnessTolerance"],
  },
};
