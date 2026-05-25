import type { TutorialStepId } from "../domain/game";

export type TutorialCopy = {
  title: string;
  body: string;
  primaryLabel?: string;
  stepIndex?: number;
  stepCount?: number;
};

export const TUTORIAL_COPY = {
  "planning.layer-nav": {
    title: "Three layers, one shift",
    body: "Focus cases, eligible roster, pick-venue layer. Scroll, hit A or D, or tap these pills to swap between the first two. Commit a pair to unlock the pick-venue layer.",
    primaryLabel: "Got it",
    stepIndex: 0,
    stepCount: 7,
  },
  "planning.focus": {
    title: "Pick tonight's lead",
    body: "Your four focus cases live here. Click a star to lock it as the lead. Double-click to open the file first. The other three wait their turn.",
    stepIndex: 1,
    stepCount: 7,
  },
  "planning.partner": {
    title: "Pick a partner",
    body: "Scroll down or tap the roster pill. Brightened stars are tonight's eligible partners. Click one to lock the pair, or double-click to read the file first.",
    stepIndex: 2,
    stepCount: 7,
  },
  "planning.intent": {
    title: "File the matchmaking intent",
    body: "Tell Cupid what you're aiming for: warmth, curiosity, a cool down, a repair, or proof of bad fit. Optional, but the room read scores against whatever you file.",
    primaryLabel: "Got it",
    stepIndex: 3,
    stepCount: 7,
  },
  "planning.commit": {
    title: "Commit the pair",
    body: "Both members on file. Commit locks them for the shift, snapshots the deck, draws tonight's hand, and opens the pick-venue layer. No takebacks.",
    primaryLabel: "Got it",
    stepIndex: 4,
    stepCount: 7,
  },
  "planning.scenario": {
    title: "Pick the room",
    body: "Three rooms, freshly drawn. Open one to lock it. The room read is a warning, not a verdict; Cupid still waits for the transcript.",
    stepIndex: 5,
    stepCount: 7,
  },
  "planning.begin": {
    title: "Begin the date",
    body: "Begin opens the room. The deck stays locked until the date resolves.",
    stepIndex: 6,
    stepCount: 7,
  },
  "planning.file-shift": {
    title: "File the shift",
    body: "One shift, one date. File it once the date settles. Skip the open roster instead and Cupid logs a mood penalty against the lead.",
  },
  "lazy.contextual-rail": {
    title: "Tools and records live up here",
    body: "Top right: Date book shapes Cupid's draw, Records opens Notes / Shift archive / pair graph, File shift closes the night. Top center: toggle Eligibles vs Off tonight, plus filter and edit icons for trimming or swapping focus cases.",
    primaryLabel: "Got it",
  },
  "lazy.date-book": {
    title: "Three modes, one pill",
    body: "Date book cycles three modes. Auto shows tonight's drawn hand after commit. Deck edits what Cupid draws from (stay under the budget cap). Library browses the full shelf to add new rooms.",
    primaryLabel: "Got it",
  },
  "lazy.cut-short": {
    title: "File the date",
    body: "Cupid has seen enough to score this one. Filing ends the date, adds one final read, and sends both members to cooldown. Use it when the room has already told you what it is.",
    primaryLabel: "Got it",
  },
  "lazy.datebook.locked": {
    title: "Date book is locked",
    body: "A pair is committed, so the deck is frozen. Finish the date before editing the deck again.",
    primaryLabel: "Got it",
  },
  "lazy.datebook.repair": {
    title: "The Date book is over budget",
    body: "A budget cut pushed the deck over the cap. Open it and drop cards until you're back under. No new pair commits until the file is clean.",
    primaryLabel: "Got it",
  },
  "lazy.cooldown-block": {
    title: "One of these is in cooldown",
    body: "A focused case is cooling off after their last date. Their star dims here and they can't be booked until next shift. Hover for the cooldown status.",
    primaryLabel: "Got it",
  },
  "lazy.closure-ready": {
    title: "Closure is permanent",
    body: "A pair is ready to delete the app. Filing closure frees two focus slots, raises the client cap by one, and pins a permanent pair memory. No rebooking after.",
    primaryLabel: "Got it",
  },
  "date.footer.health": {
    title: "Health, Turn, Cupid, Nudges",
    body: "Health tracks the date. Turn counts toward the wrap. Cupid files a read every sixth turn. Nudges are your three whispers. Scene chips appear once drafted; tap one while paused to drop it in.",
    primaryLabel: "Got it",
    stepIndex: 0,
    stepCount: 2,
  },
  "date.footer.transport": {
    title: "Run the date",
    body: "Tap play for autoplay, or step one beat at a time. Pause to whisper a nudge or drop a scene. Space toggles play.",
    stepIndex: 1,
    stepCount: 2,
  },
} satisfies Partial<Record<TutorialStepId, TutorialCopy>>;

export type TutorialCopyId = keyof typeof TUTORIAL_COPY;

export function tutorialCopy(id: TutorialCopyId): TutorialCopy {
  return TUTORIAL_COPY[id];
}
