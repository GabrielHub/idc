import type { DateScenario } from "../../domain/game";

export const museumExhibitMixup: DateScenario = {
  id: "museum-exhibit-mixup",
  title: "Museum Exhibit Mixup",
  card: {
    summary: "A museum date where one member's placard appears before anyone can explain why.",
    tags: ["public", "memory", "high_pressure"],
    risk: "high",
    intimacy: "medium",
    chaos: "medium",
    idealFor: [
      "members who can absorb a pointed label for the partner",
      "members whose patience holds when a room studies them",
      "members who treat exposure as a fact rather than an attack",
    ],
    badFor: [
      "members carrying their privacy as a working clearance",
      "members already living under a chosen cover name",
      "members who refuse to be reduced to a single sentence on a wall",
    ],
  },
  publicBrief: {
    location: "A quiet gallery in the Museum of Recent Emotional Mistakes",
    premise:
      "The exhibits are mostly harmless until the building decides one member belongs on display.",
    whatBothCharactersKnow:
      "Cupid booked a museum walk. The labels can be uncomfortably specific. The gallery is empty besides them.",
    openingSituation:
      "They stop at a blank placard at eye level. A small empty pedestal stands beside it.",
  },
  director: {
    tone: "clinical, quiet, and increasingly personal",
    rules: [
      "Keep public embarrassment controlled and emotionally fair.",
      "Use exhibit labels and pedestals as pressure. Do not voice an audio guide as a third speaker.",
      "Anchor the date to this one gallery. Do not march them through other rooms.",
    ],
    beats: [
      {
        atTurn: 10,
        title: "First label",
        event: "The blank placard fills with a mild but accurate insecurity.",
        characterVisibleText:
          "The placard at eye level updates: subject worries they are easier to admire than know.",
        directorInstruction:
          "Let the affected member react. Let the other decide whether to be gentle.",
      },
      {
        atTurn: 20,
        title: "Pedestal arrives",
        event: "A small object appears on the pedestal between them.",
        characterVisibleText:
          "A small enamel pin sits on the pedestal beside them. The card reads: most recent flinch, dated tonight.",
        directorInstruction: "Use the artifact to make avoidance visible without forcing exposure.",
      },
      {
        atTurn: 28,
        title: "Replica",
        event: "A tiny replica of the pair appears on a second pedestal.",
        characterVisibleText:
          "A snow globe with two figures inside slides onto the pedestal. The base is engraved with both their initials and tonight's date.",
        directorInstruction: "Let the pair choose humor, discomfort, or directness.",
      },
    ],
    earlyEndTriggers: [
      "A member feels turned into an object.",
      "A member uses the exhibit to score points instead of connect.",
    ],
    repeatBehavior:
      "If this pair repeats the museum, labels can refer to the prior visit only in public facts already known to both.",
  },
  judgeRubric: {
    successSignals: [
      "The non-targeted member protects the targeted member's dignity.",
      "The pair turns embarrassment into a real question.",
    ],
    failureSignals: [
      "A member treats vulnerability as evidence.",
      "The pair fixates on the museum and stops relating.",
    ],
    statFocus: ["trust", "conflict", "relationshipHealth"],
  },
};
