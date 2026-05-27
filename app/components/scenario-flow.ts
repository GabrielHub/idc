import type { ScenarioFlow } from "../domain/game";

export const SCENARIO_FLOW_LABEL: Record<ScenarioFlow, string> = {
  conversation: "Conversation",
  activity: "Activity",
  pressure: "Pressure",
  set_piece: "Set Piece",
};

export const SCENARIO_FLOW_SHORT: Record<ScenarioFlow, string> = {
  conversation: "CHAT",
  activity: "ACTIVE",
  pressure: "STAKES",
  set_piece: "SCENE",
};

export const SCENARIO_FLOW_BLURB: Record<ScenarioFlow, string> = {
  conversation:
    "Mostly talking. The room is the backdrop; the date is the two of them paying attention.",
  activity:
    "Conversation while their hands are busy. The pair makes small choices as the task moves.",
  pressure:
    "Short and choice-driven. The room is asking for an answer; drifting reads as ducking it.",
  set_piece:
    "An evolving scene with several action beats. The room changes around them and they react.",
};

export const SCENARIO_FLOW_DOT_TONE: Record<ScenarioFlow, string> = {
  conversation: "bg-sky-500",
  activity: "bg-emerald-500",
  pressure: "bg-amber-500",
  set_piece: "bg-violet-500",
};

export const SCENARIO_FLOW_TEXT_TONE: Record<ScenarioFlow, string> = {
  conversation: "text-sky-700",
  activity: "text-emerald-700",
  pressure: "text-amber-700",
  set_piece: "text-violet-700",
};

export const SCENARIO_FLOW_CATHEDRAL_TONE: Record<ScenarioFlow, { pill: string; eyebrow: string }> =
  {
    conversation: {
      pill: "bg-sky-400/20 border-sky-300/45 text-sky-200",
      eyebrow: "text-sky-200",
    },
    activity: {
      pill: "bg-emerald-400/20 border-emerald-300/45 text-emerald-200",
      eyebrow: "text-emerald-200",
    },
    pressure: {
      pill: "bg-amber-400/20 border-amber-300/45 text-amber-200",
      eyebrow: "text-amber-200",
    },
    set_piece: {
      pill: "bg-violet-400/20 border-violet-300/45 text-violet-200",
      eyebrow: "text-violet-200",
    },
  };
