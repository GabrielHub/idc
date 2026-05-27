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
    flow: "pressure",
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
        pitch:
          "Force small public attention on your table. Tests how the pair narrates themselves to relatives passing within reach.",
        beat: "Two flutes come up to the rim. The server moves to the next table without comment. An uncle in a sport coat passes behind their chairs to refill his own water.",
        directorBeat:
          "Two strangers just walked through your space. Decide how visible to be: lift the glass, lean closer, sit straighter, joke quietly, or hold still. Reveal something about how you handle being read. Do not voice the server or the uncle.",
      },
      {
        id: "cousins-wedding-plus-one-event-2",
        title: "Toast lands",
        kind: "ambient",
        pitch:
          "Drop a public ritual across the room. Forces the pair to share a small quiet moment inside someone else's spotlight.",
        beat: "Glasses go up around the room. Silverware stops on a hundred plates. The maid of honor's toast carries from the far side of the hall.",
        directorBeat:
          "A public toast just took the room. You are far enough to whisper. Choose: lift your own glass, exchange a look with your date, comment under the cover of noise, or sit silent together. Use the cover. Do not voice the toast as continuing dialogue.",
      },
      {
        id: "cousins-wedding-plus-one-event-3",
        title: "First slow song",
        kind: "provocation",
        pitch:
          "Force a dance floor moment. Both have to decide whether to leave the table together or stay sitting.",
        beat: "The first slow song begins. Two couples step out. The dance floor lights tilt warm. Their table is still mostly seated.",
        directorBeat:
          "A slow song just started. This turn, decide visibly: invite them to dance, refuse the floor, joke about it, or wait for them to move first. Do not let the song pass without naming what you are doing.",
      },
      {
        id: "cousins-wedding-plus-one-event-4",
        title: "Cake cut",
        kind: "reveal",
        pitch:
          "Land a peak ritual at the head table. Tests whether the pair stays close without staging it for the cameras.",
        beat: "Phones go up around the room. The bride and groom cut a sheet cake at the head table. A small cheer lands and fades. Their table is one person short of joining in.",
        directorBeat:
          "The biggest moment of the night is happening across the room. Join the crowd, watch from here, or use the noise as cover for something quieter. Pick one and own it. Do not stage your reaction for the room.",
      },
      {
        id: "cousins-wedding-plus-one-event-5",
        title: "Photographer pass",
        kind: "reveal",
        pitch:
          "Turn the lens elsewhere. Tests who relaxes and who flinches when they think they are not being filed.",
        beat: "The photographer drifts past table fourteen, lifts the camera, and chooses a different angle of the dance floor. The shutter does not fire here. The lens cap dangles from a strap.",
        directorBeat:
          "The camera just turned away from you. Notice the lift: relax visibly, lean in, drop the public posture, or stay armored anyway. Each move tells your date something. Do not voice the photographer.",
      },
      {
        id: "cousins-wedding-plus-one-event-6",
        title: "Bar refresh",
        kind: "ambient",
        pitch:
          "Skip the pair on the next pour. Adjusts the table heat to either less buzzed or more pointed about it.",
        beat: "A tray of fresh pours moves between the tables. The server stops at table fifteen and not at fourteen. The flutes from earlier are still mostly full.",
        directorBeat:
          "Your table just got passed over. Decide whether you noticed: flag it lightly, joke about the skip, defend the pace, or sit with it. Use the small slight to change the heat. Do not voice the server.",
      },
      {
        id: "cousins-wedding-plus-one-event-7",
        title: "Bouquet round",
        kind: "ambient",
        pitch:
          "Call singles to the floor. Forces a small how-do-we-look-to-the-room choice for the pair.",
        beat: "The DJ calls for anyone single to gather at the dance floor. Five guests drift over. A few stay seated and pretend not to hear. Table fourteen does not move.",
        directorBeat:
          "A public single status call just hit the room. Stay seated together with a comment, exchange a look, joke about whether either of you qualifies, or let one of you play along. Pick one and name it. Do not voice the DJ.",
      },
      {
        id: "cousins-wedding-plus-one-event-8",
        title: "Coat check",
        kind: "provocation",
        pitch:
          "Land two sequential coat tickets between you. Forces a clean read on leaving together or staying it out.",
        beat: "A coat check attendant in a red vest sets two paper tickets on the table. The numbers are in sequence. The reception still has at least an hour to run.",
        directorBeat:
          "Two coats and one decision just landed. Choose: get the coats and go, signal you want to stay, ask your date what they want, or ignore the tickets for now. Do not let them sit unaddressed past your next line. Do not voice the attendant.",
      },
      {
        id: "cousins-wedding-plus-one-event-9",
        title: "Group photo call",
        kind: "provocation",
        pitch:
          "Page table fourteen for the extended family photo. Forces a clean call to go, to send one of you, or to pass on it.",
        beat: "A small page slides across the table from a coordinator: extended family group photo at the staircase, table fourteen included, two minutes. Two of the seats at the table are already empty.",
        directorBeat:
          "The wedding is asking you to stand and walk to the staircase. Decide: both of you go, send only the cousin, or pass with a reason. Name the choice clearly. Do not voice the coordinator.",
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
