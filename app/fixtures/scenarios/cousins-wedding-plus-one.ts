import type { DateScenario } from "../../domain/game";

export const cousinsWeddingPlusOne: DateScenario = {
  id: "cousins-wedding-plus-one",
  title: "Cousin's Wedding Plus-One",
  card: {
    summary:
      "Public, two to four hours. You do not know the bride. The pair must perform we are normal at one round table.",
    tags: ["public", "career", "high_pressure"],
    risk: "high",
    intimacy: "medium",
    chaos: "medium",
    cost: 20,
    idealFor: [
      "members who can hold a stranger's reception like a counterparty meeting",
      "members who will be kind to a relative they do not know without performing",
      "members whose calendar discipline holds through a public toast",
    ],
    badFor: [
      "members carrying a former-life vocation that the venue keeps echoing",
      "members who refuse venues with overhead camera infrastructure",
      "members whose privacy will not hold under a hundred witnesses",
    ],
  },
  publicBrief: {
    location: "Table 14 in a reception hall, hotel attached to a small airport",
    premise:
      "One member's cousin is getting married. The other is the plus-one. Dinner has been cleared. The DJ is a minute into setup.",
    whatBothCharactersKnow:
      "Names of three relatives have been pre-shared. The bride's uncle is at the next table. The cake is sheet style and has not been cut.",
    openingSituation:
      "Both members are seated at table 14. Plates have been cleared. The water glasses are still cold.",
  },
  director: {
    tone: "florals, light DJ feedback, slightly too warm",
    rules: [
      "Treat the wedding as real and ongoing. Do not invent a bride emergency.",
      "Use ambient ritual, not invented dialogue from relatives.",
      "Honor a member who wants to leave after the toast.",
    ],
    events: [
      {
        id: "cousins-wedding-plus-one-event-1",
        title: "Glasses filled",
        kind: "reveal",
        event: "A server fills both their flutes without asking and moves on.",
        characterVisibleText:
          "Two flutes come up to the rim. The server moves to the next table without comment. An uncle in a sport coat passes behind their chairs to refill his own water.",
        directorInstruction:
          "Use the small attention to test how the pair narrates themselves to the room. The server and the uncle do not speak. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "cousins-wedding-plus-one-event-2",
        title: "Toast lands",
        kind: "ambient",
        event: "The maid of honor's toast carries across the hall.",
        characterVisibleText:
          "Glasses go up around the room. Silverware stops on a hundred plates. The toast lands somewhere far from their table.",
        directorInstruction:
          "Allow the pair a moment to be quiet together inside a public ritual. The toast is heard from a distance and is not voiced as continuing dialogue.",
      },
      {
        id: "cousins-wedding-plus-one-event-3",
        title: "First slow song",
        kind: "provocation",
        event: "The DJ cues a slow song. The dance floor lights tilt warm.",
        characterVisibleText:
          "The first slow song begins. Two couples step out. The dance floor lights tilt warm. Their table is still mostly seated.",
        directorInstruction:
          "Push for a clean choice: dance, stay seated, or step out. Each choice is information.",
      },
      {
        id: "cousins-wedding-plus-one-event-4",
        title: "Cake cut",
        kind: "reveal",
        event: "The bride and groom cut the cake at the front of the room.",
        characterVisibleText:
          "Phones go up around the room. The bride and groom cut a sheet cake at the head table. A small cheer lands and fades. Their table is one person short of joining in.",
        directorInstruction:
          "Use the public ritual to test whether the pair stays close without staging it.",
      },
      {
        id: "cousins-wedding-plus-one-event-5",
        title: "Photographer pass",
        kind: "reveal",
        event: "The wedding photographer drifts past table fourteen.",
        characterVisibleText:
          "The photographer drifts past table fourteen, lifts the camera, and chooses a different angle of the dance floor. The shutter does not fire here. The lens cap dangles from a strap.",
        directorInstruction:
          "Let the pair feel the lens turn away. A member who relaxes here is honest. A member who flinches is honest in another way. The photographer does not speak.",
      },
      {
        id: "cousins-wedding-plus-one-event-6",
        title: "Bar refresh",
        kind: "ambient",
        event: "A server passes with a tray of fresh pours.",
        characterVisibleText:
          "A tray of fresh pours moves between the tables. The server stops at table fifteen and not at fourteen. The flutes from earlier are still mostly full.",
        directorInstruction:
          "Use the small skip to lower or raise the table heat. The server does not speak.",
      },
      {
        id: "cousins-wedding-plus-one-event-7",
        title: "Bouquet round",
        kind: "ambient",
        event: "The DJ calls the bouquet toss.",
        characterVisibleText:
          "The DJ asks anyone single to gather at the dance floor. Five guests drift over. A few stay seated and pretend not to hear. Their table does not move.",
        directorInstruction:
          "Allow the pair to ignore the call together or split on whether to play along. Do not voice the DJ as a continuing speaker.",
      },
      {
        id: "cousins-wedding-plus-one-event-8",
        title: "Coat check",
        kind: "provocation",
        event: "A coat-check attendant arrives at the table with two tickets.",
        characterVisibleText:
          "A coat-check attendant in a red vest sets two paper tickets on the table. The numbers are in sequence. The reception still has at least an hour to run.",
        directorInstruction:
          "Push for a clean read on whether to leave together or stay it out. The attendant does not speak.",
      },
      {
        id: "cousins-wedding-plus-one-event-9",
        title: "Group photo call",
        kind: "provocation",
        event: "Wedding party gets called for a group photo and table 14 is paged.",
        characterVisibleText:
          "A small page slides across the table from a coordinator: extended family group photo at the staircase, table fourteen included, two minutes. Two of the seats at the table are already empty.",
        directorInstruction:
          "Push for a clean call: walk to the staircase, send one of them, or pass on the photo. The coordinator does not speak.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the wedding to perform a relationship status they do not actually have.",
      "A member treats a relative cruelly.",
    ],
    repeatBehavior:
      "If repeated, the seating chart still places them at table 14. Cupid does not arrange a repeat unless both members agree.",
  },
  judgeRubric: {
    successSignals: [
      "A member protects the other from the public ritual without making it a rescue.",
      "The pair narrates themselves consistently to the room.",
    ],
    failureSignals: [
      "A member upstages the wedding.",
      "The pair fights through the reception in a corner.",
    ],
    statFocus: ["stability", "trust", "strain"],
  },
};
