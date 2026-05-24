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
    body: "Tonight's lobby stacks the four focus cases, the eligible roster, and the date cathedral as three layers. Scroll or use A / D - or these pills - to move between the first two layers. Commit pair unlocks the cathedral.",
    primaryLabel: "Got it",
    stepIndex: 0,
    stepCount: 7,
  },
  "planning.focus": {
    title: "Pick tonight's lead",
    body: "The four focus cases sit on this layer. Click any star to morph it open and confirm it as the lead - double-click instead to read the full case file. The other three wait on file.",
    stepIndex: 1,
    stepCount: 7,
  },
  "planning.partner": {
    title: "Roll to the roster, pick a partner",
    body: "Scroll one notch down - or tap this pill - to surface tonight's eligible partners. Click a brightened star to morph it open and lock the pair; double-click to read the file first.",
    stepIndex: 2,
    stepCount: 7,
  },
  "planning.intent": {
    title: "File the matchmaking intent",
    body: "Optional, but it tells Cupid what you're aiming for tonight - encourage warmth, push for a curiosity, cool the room down, repair a breach, or test whether they're a bad fit. The room read scores against the intent you file.",
    primaryLabel: "Got it",
    stepIndex: 3,
    stepCount: 7,
  },
  "planning.commit": {
    title: "Commit the pair",
    body: "Both members are on file. Commit pair locks them for this shift, snapshots the deck, draws tonight's hand, and opens the cathedral. You cannot go back after commit.",
    primaryLabel: "Got it",
    stepIndex: 4,
    stepCount: 7,
  },
  "planning.scenario": {
    title: "Pick the room",
    body: "These are tonight's drawn scenarios. Open one to lock it. Room read is a warning, not a verdict - Cupid still waits for transcript evidence.",
    stepIndex: 5,
    stepCount: 7,
  },
  "planning.begin": {
    title: "Begin the date",
    body: "Begin opens the selected room from the committed hand. The deck stays locked until the date resolves.",
    stepIndex: 6,
    stepCount: 7,
  },
  "planning.file-shift": {
    title: "File the shift",
    body: "One shift, one date. File it when the date is settled. If you skip the open roster instead, Cupid files the lead ask as sitting and applies the mood penalty.",
  },
  "lazy.contextual-rail": {
    title: "Tools and records live up here",
    body: "Date book shapes Cupid's draw. Records folds out into Notes, Shift archive, and the pair graph. Lens filters the roster, Manage cases swaps a focused file. File shift closes the night when every date is settled.",
    primaryLabel: "Got it",
  },
  "lazy.date-book": {
    title: "Three modes, one pill",
    body: "The Date book pill cycles three modes. Auto shows tonight's drawn hand after commit. Deck edits what Cupid can draw from - drop cards under the budget cap. Library browses the full scenario shelf so you can add new rooms to the deck.",
    primaryLabel: "Got it",
  },
  "lazy.cut-short": {
    title: "Cut short, file the read",
    body: "Cupid has seen enough to score this one. Cut short ends the date now - Cupid files one final read and sends both members to cooldown. Use it when the room is going nowhere or going badly.",
    primaryLabel: "Got it",
  },
  "lazy.datebook.locked": {
    title: "Date book is locked",
    body: "A pair is committed, so the deck is frozen until the date resolves. Finish the date before editing the deck again.",
    primaryLabel: "Got it",
  },
  "lazy.datebook.repair": {
    title: "The Date book is over budget",
    body: "A budget cut put the deck above the cap. Open the deck and drop cards until the spend is back under the cap. Cupid can't commit a new pair until the file is clean.",
    primaryLabel: "Got it",
  },
  "lazy.cooldown-block": {
    title: "One of these is in cooldown",
    body: "A focused case is cooling off after their last date. Their star dims on this layer and they can't be booked until the next shift - their hover card shows the cooldown status.",
    primaryLabel: "Got it",
  },
  "lazy.closure-ready": {
    title: "Closure is permanent",
    body: "A pair is ready to delete the app. File the closure to free two focus slots, raise the client cap by one, and pin a permanent pair memory. There is no rebooking after closure.",
    primaryLabel: "Got it",
  },
  "date.footer.health": {
    title: "Health, Turn, Cupid, Nudges",
    body: "Health is the date. Turn counts toward the wrap. Cupid files a read every sixth. Nudges are your three whispers. Scene chips appear once you draft them - tap one while paused to drop it into the room.",
    primaryLabel: "Got it",
    stepIndex: 0,
    stepCount: 2,
  },
  "date.footer.transport": {
    title: "Run the date",
    body: "Tap play for autoplay, or advance one beat at a time. Pause whenever you want to whisper a nudge or drop a scene. Space toggles play.",
    stepIndex: 1,
    stepCount: 2,
  },
} satisfies Partial<Record<TutorialStepId, TutorialCopy>>;

export type TutorialCopyId = keyof typeof TUTORIAL_COPY;

export function tutorialCopy(id: TutorialCopyId): TutorialCopy {
  return TUTORIAL_COPY[id];
}
