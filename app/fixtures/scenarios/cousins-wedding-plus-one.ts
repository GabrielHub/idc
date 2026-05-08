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
    beats: [
      {
        atTurn: 10,
        title: "Glasses filled",
        event: "A server fills both their flutes without asking and moves on.",
        characterVisibleText:
          "Two flutes come up to the rim. The server moves to the next table without comment. An uncle in a sport coat passes behind their chairs to refill his own water.",
        directorInstruction: "Use the small attention to test how the pair narrates themselves.",
      },
      {
        atTurn: 20,
        title: "Toast lands",
        event: "The maid of honor's toast carries across the hall.",
        characterVisibleText:
          "Glasses go up around the room. Silverware stops on a hundred plates. The toast lands somewhere far from their table.",
        directorInstruction: "Allow the pair a moment to be quiet together inside a public ritual.",
      },
      {
        atTurn: 28,
        title: "First slow song",
        event: "The DJ cues a slow song. The dance floor lights tilt warm.",
        characterVisibleText:
          "The first slow song begins. Two couples step out. The dance floor lights tilt warm. Their table is still mostly seated.",
        directorInstruction:
          "Let the pair choose to dance, sit, or leave. Each choice is information.",
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
