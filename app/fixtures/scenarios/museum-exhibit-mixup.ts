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
    idealFor: ["members with patience", "pairs ready for direct questions"],
    badFor: ["privacy-sensitive members", "members afraid of being studied"],
  },
  publicBrief: {
    location: "The Museum of Recent Emotional Mistakes",
    premise:
      "The exhibits are mostly harmless until the building decides one member belongs on display.",
    whatBothCharactersKnow: "Cupid booked a museum walk. The labels can be uncomfortably specific.",
    openingSituation:
      "They arrive at a quiet gallery and find a blank placard waiting at eye level.",
  },
  director: {
    tone: "clinical, quiet, and increasingly personal",
    rules: [
      "Keep public embarrassment controlled and emotionally fair.",
      "Do not reveal another member's secrets to character performers.",
      "Use exhibit labels as pressure, not exposition dumps.",
    ],
    beats: [
      {
        atTurn: 8,
        title: "First label",
        event: "The blank placard fills with a mild but accurate insecurity.",
        characterVisibleText:
          "The placard updates: Subject worries they are easier to admire than know.",
        directorInstruction:
          "Let the affected member react. Let the other decide whether to be gentle.",
      },
      {
        atTurn: 18,
        title: "Audio guide",
        event: "The audio guide begins narrating silence between them.",
        characterVisibleText:
          "The audio guide says: this pause has been preserved for educational reasons.",
        directorInstruction: "Use the interruption to make avoidance visible.",
      },
      {
        atTurn: 26,
        title: "Gift shop exit",
        event: "The exit routes them through a gift shop full of tiny replicas of the pair.",
        characterVisibleText: "The gift shop offers a tiny snow globe of this exact conversation.",
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
