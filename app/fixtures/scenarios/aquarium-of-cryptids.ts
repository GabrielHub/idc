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
    cost: 19,
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
        pitch:
          "Glide a large back fin past at eye level. Surfaces whether either pauses, walks on, or comments on the body that stays mostly hidden.",
        beat: "The long glass tube of the loch tank runs along the corridor wall at eye level. A wide back fin glides past once. The head stays off-frame. The water is dim and the tube hums from the chiller below.",
        directorBeat:
          "A body just moved past the glass. Stop, point, keep walking, or comment on what you can and cannot see. Notice the fin in your next beat. Do not voice the cryptid.",
      },
      {
        id: "aquarium-of-cryptids-event-2",
        title: "Salt-pressure tank",
        kind: "ambient",
        pitch:
          "Let the still robed figure in the high-pressure tank pull whoever lingers. Surfaces how the pair handles a partner who stops longer than the route asks.",
        beat: "The next tank holds at a higher salt pressure. The water inside is still. A robed figure sits cross-legged on the tank floor, hands folded, head bowed. The plaque under the tank lists a flooded branch year.",
        directorBeat:
          "Someone is going to want to linger here. Choose: stop with them, wait a step ahead, ask what they are reading in it, or keep moving and trust them to catch up. Make the pacing visible. Do not voice the figure.",
      },
      {
        id: "aquarium-of-cryptids-event-3",
        title: "Drowned cathedral diorama",
        kind: "ambient",
        pitch:
          "Drift eels through a half-flooded cathedral diorama. Surfaces taste in what either calls out or stays quiet about.",
        beat: "The cathedral diorama tank holds a half-flooded nave at scale. Three eels drift through the choir loft. A small pew is canted against the rail. The water has a green cast.",
        directorBeat:
          "A small detailed scene just landed in your field of view. Point at one piece, ask your date what catches them, sit with the green cast, or pass it without comment. Notice in your next beat. Do not voice the diorama.",
      },
      {
        id: "aquarium-of-cryptids-event-4",
        title: "Kraken juvenile",
        kind: "provocation",
        pitch:
          "Press a juvenile tentacle to the glass at arm's length from the pair. Forces a real physical move: step back, hold the spot, or go closer.",
        beat: "The juvenile tank is mostly dark. A small tentacle the length of an arm reaches across the inside of the glass and holds. The skin is a slow color shift. The tank is rated for the juvenile only.",
        directorBeat:
          "Something just reached for you through the glass. Move your body in your next beat: step back, lean in, put a hand near it, or pull your date away. Name the move. Do not voice the juvenile.",
      },
      {
        id: "aquarium-of-cryptids-event-5",
        title: "Leviathan eye",
        kind: "provocation",
        pitch:
          "Open the leviathan's eye and let it track the pair across the corridor. Forces a real reaction, not a narration.",
        beat: "Behind three-foot glass, the partial leviathan exhibit takes up the whole far wall. One slow eye opens. The eye tracks across the corridor and settles on the pair for a beat before drifting on. The rib cage behind it does not move.",
        directorBeat:
          "Something the size of a building just looked at you for a count of two. React in your body or your line: laugh it off, hold still, take your date's wrist, step toward the glass, or move past faster. Do not narrate the tracking like a tour guide. Do not voice the leviathan.",
      },
      {
        id: "aquarium-of-cryptids-event-6",
        title: "Touch tank",
        kind: "provocation",
        pitch:
          "End the loop at a touch tank with a card that reads she notices. Forces a real choice: reach in, decline aloud, or move past.",
        beat: "The corridor ends at a low shallow tank. The water is cool and clear. A small printed card on the rim reads: she notices. A folded sleeve of hand towels sits next to the tank. The water surface is flat.",
        directorBeat:
          "The tank is in front of you and the card is doing work. Reach in, hold your hand near the water, decline aloud, or invite your date to go first. Pick a move and own it. Do not voice the card or the tank.",
      },
      {
        id: "aquarium-of-cryptids-event-7",
        title: "A named sea",
        kind: "reveal",
        pitch:
          "Surface a sea by its full name on a plaque. Pulls whatever either of you already carries about that water into the open.",
        beat: "The plaque under the jellies tank carries the full name of the sea the jellies came from. The name takes two lines. The plaque carries no date.",
        directorBeat:
          "A specific sea just got named. Engage with it from what you already know about your own life or this pair, not invented biography. Read it aloud, say it means nothing to you, or let it land quietly. Stay honest.",
      },
      {
        id: "aquarium-of-cryptids-event-8",
        title: "Loop doubles",
        kind: "reveal",
        pitch:
          "Pass the kraken tank twice on the way back. Surfaces how either handles a small return that wasn't asked for.",
        beat: "The corridor loop passes the kraken tank twice on its way back. The juvenile is on the other side of the glass on the second pass. The route is otherwise the same.",
        directorBeat:
          "You are seeing the same tank a second time. Notice the return: comment on the second look, slow down for it, or speed past. Tie it to something you already know about this pair. Do not invent new biography.",
      },
      {
        id: "aquarium-of-cryptids-event-9",
        title: "Photo strip kiosk",
        kind: "reveal",
        pitch:
          "Plant a photo kiosk with one strip token at the exit. Forces a stance: stage a strip together, take a solo, or walk past.",
        beat: "The photo strip kiosk sits at the corridor exit. The strip prints with two empty frames if no one stands in front of the camera. A small wooden token in the slot is good for one strip.",
        directorBeat:
          "The kiosk is asking for a decision. Suggest the strip together, decline, ask if they want one, or take the token and pocket it. Speak from how you already feel about being photographed with this person.",
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
