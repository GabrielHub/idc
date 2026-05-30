import type { TutorialStepId } from "../domain/game";
import { FOCUS_SWAP_RETENTION_PENALTY } from "./focus-cases";

export type TutorialCopy = {
  title: string;
  body: string;
  primaryLabel?: string;
  stepIndex?: number;
  stepCount?: number;
};

export const TUTORIAL_COPY = {
  "onboarding.focus.pick": {
    title: "Cupid is hiring. You are hired.",
    body: "These hopefuls walked into the office today. Pick four focus cases. The rest of the roster waits in the hall, technically supervised.",
  },
  "onboarding.focus.expand": {
    title: "Read the file",
    body: "Tap a card's arrow to open their file. Worth a peek before you commit a focus slot to them.",
  },
  "onboarding.focus.start": {
    title: "Draft the Date Book",
    body: "Four cases on file. Next up: pick the starter rooms Cupid can draw from once you commit a pair.",
  },
  "onboarding.deck.pick": {
    title: "Build the Date Book",
    body: "This is the pool Cupid draws from. Pick six to twelve room cards, stay under budget. The drawn hand comes later, after you commit a pair.",
  },
  "onboarding.deck.expand": {
    title: "Scout the room",
    body: "Tap a room card's arrow to open the brief. Worth a peek for the tone and rules before you spend on it.",
  },
  "onboarding.deck.start": {
    title: "Start the shift",
    body: "Date Book is legal. Start the shift and Cupid opens the lobby. Pick a lead case, then a different partner, then commit. Three room cards get drawn from this pool.",
    primaryLabel: "Start the shift",
  },
  "planning.layer-nav": {
    title: "Three layers, one shift",
    body: "Focus cases, eligible roster, room layer. Scroll, hit A or D, or tap these pills to swap between the first two. Commit a pair to unlock the room layer.",
    primaryLabel: "Got it",
    stepIndex: 0,
    stepCount: 8,
  },
  "planning.shift-brief": {
    title: "Read the shift brief",
    body: "This dock is tonight's work order: the lead ask, company goals, closure and follow-up gates, and whether File shift is blocked. It updates as dates resolve.",
    primaryLabel: "Got it",
    stepIndex: 1,
    stepCount: 8,
  },
  "planning.focus": {
    title: "Pick tonight's lead",
    body: "Your four focus cases live here. Click a star to lock it as the lead. Double-click to open the file first. The other three wait their turn.",
    stepIndex: 2,
    stepCount: 8,
  },
  "planning.partner": {
    title: "Pick a partner",
    body: "Scroll down or tap the roster pill. Brightened stars are tonight's eligible partners. Click one to lock the pair, or double-click to read the file first.",
    stepIndex: 3,
    stepCount: 8,
  },
  "planning.intent": {
    title: "File the matchmaking intent",
    body: "Tell Cupid what you're aiming for: warmth, curiosity, a cool down, a repair, or proof of bad fit. Optional, but the room read scores against whatever you file.",
    primaryLabel: "Got it",
    stepIndex: 4,
    stepCount: 8,
  },
  "planning.commit": {
    title: "Commit the pair",
    body: "Both members on file. Commit locks them for the shift, snapshots the Date Book, draws tonight's room cards, and opens the room layer. No takebacks.",
    primaryLabel: "Got it",
    stepIndex: 5,
    stepCount: 8,
  },
  "planning.scenario": {
    title: "Pick the room",
    body: "Three rooms, freshly drawn. Open one to lock it. The room read is a warning, not a verdict; Cupid still waits for the transcript.",
    stepIndex: 6,
    stepCount: 8,
  },
  "planning.begin": {
    title: "Begin the date",
    body: "Begin opens the room. The Date Book stays locked until the date resolves.",
    stepIndex: 7,
    stepCount: 8,
  },
  "date.draft-events": {
    title: "Draft three scenes",
    body: "Two ambient, two provocations, two reveals. Pick three to drop into the date when you pause. Cupid never plays them for you.",
  },
  "date.footer.health": {
    title: "Health, reads, nudges, scenes",
    body: "Health tracks the room. Turn counts toward the wrap. Cupid files a read every sixth turn. Nudges are your three whispers. Scene chips appear once drafted; pause to drop one. A lead-ask chip shows whether the date is covering tonight's ask.",
    primaryLabel: "Got it",
    stepIndex: 0,
    stepCount: 2,
  },
  "date.footer.transport": {
    title: "Run the date",
    body: "Play starts autoplay, step advances one exchange, and stop cancels a streaming beat. Pause before whispering a nudge or dropping a scene. Space toggles play.",
    stepIndex: 1,
    stepCount: 2,
  },
  "date.judge-note": {
    title: "Six turns, one snapshot",
    body: "Cupid reads every sixth turn and at the wrap. Health moves here, filed reads unlock files, and pair memory can gain agreements or open loops from the evidence.",
    primaryLabel: "Got it",
  },
  "date.nudge.compose": {
    title: "One nudge, one whisper",
    body: "Pause, pick one member, write one sentence. This is a private Cupid note for that performer, not a line to read aloud. Spend all three and the room is on its own.",
    primaryLabel: "Open composer",
  },
  "date.followup": {
    title: "File one follow-up",
    body: "Pursue keeps this pair warm and bypasses their next-shift cooldown. Cool Down pauses without closing the lane. Close retires the romantic lane permanently. The shift cannot close until every completed date has one filed.",
  },
  "planning.file-shift": {
    title: "File the shift",
    body: "File shift closes tonight, scores the lead ask and company goals, runs any budget review, then starts the next shift. Filing with no date marks the roster skipped and can dent the lead.",
  },
  "lazy.contextual-rail": {
    title: "Tools and records live up here",
    body: "Top right: Date Book shapes Cupid's draw. Records opens Notes, Shift archive, and pair graph. File shift closes the night. Top center: toggle Eligibles and Off tonight, plus filter and edit icons for case trims.",
    primaryLabel: "Got it",
  },
  "lazy.date-book": {
    title: "Date Book is unlocked",
    body: "Now that Cupid has one filed report, this pill opens the Date Book. Auto shows tonight's draw after commit. Edit shows the pool Cupid draws from; drop room cards here to trim it. New room cards arrive after dates and closures.",
    primaryLabel: "Got it",
  },
  "lazy.datebook.card-offer": {
    title: "New room cards after dates",
    body: "After dates and closures, Cupid offers new room cards. Take what fits, drop room cards only if the Date Book would overfill or go over budget, or skip to return the offer to the pile.",
    primaryLabel: "Got it",
  },
  "lazy.cut-short": {
    title: "File the date",
    body: "Cupid has seen enough to score this one. Filing ends the date, adds one final read, and sends both members to cooldown. Use it when the room has already told you what it is.",
    primaryLabel: "Got it",
  },
  "lazy.roster.swap-penalty": {
    title: "Swapping costs retention",
    body: `Dropping a focused case costs ${FOCUS_SWAP_RETENTION_PENALTY} retention on that file. Pick the replacement before you file the change; follow-up reserved members cannot be grabbed for a swap.`,
    primaryLabel: "Got it",
  },
  "lazy.datebook.locked": {
    title: "Date Book is locked",
    body: "A pair is committed, so the Date Book is frozen. Finish the date before editing room cards again.",
    primaryLabel: "Got it",
  },
  "lazy.datebook.repair": {
    title: "Date Book is over budget",
    body: "A budget cut pushed the Date Book over cap. Open it and drop room cards until you're back under. No new pair commits until the file is clean.",
    primaryLabel: "Got it",
  },
  "lazy.cooldown-block": {
    title: "One of these is in cooldown",
    body: "A focused case is cooling off after their last date. Their star dims here and they cannot be booked until next shift. Hover for the cooldown status.",
    primaryLabel: "Got it",
  },
  "lazy.closure-ready": {
    title: "Closure is permanent",
    body: "A pair is ready to delete the app. Filing closure frees two focus slots, adds Date Book budget, lifts retention for the remaining active cases, and pins a permanent pair memory. No rebooking after.",
    primaryLabel: "Got it",
  },
  "lazy.files.first-agreement": {
    title: "Agreements and open loops",
    body: "Pair memory tracks current asks, active agreements, open loops, and recent changes. Agreements are promises the pair made; open loops are questions still hanging. Both shape the next room read.",
    primaryLabel: "Got it",
  },
  "member.file.first-open": {
    title: "Files start mostly sealed",
    body: "The public profile is what they wrote. Everything else unseals as Cupid files reads from the dates you run.",
    primaryLabel: "Got it",
  },
  "scenario.file.first-open": {
    title: "Read the room before you book it",
    body: "Every brief lays out the premise, the room constraints, what both daters know, and what Cupid rewards or punishes. Skim it so the match lands in the right kind of mess.",
    primaryLabel: "Got it",
  },
} satisfies Record<TutorialStepId, TutorialCopy>;

export type TutorialCopyId = keyof typeof TUTORIAL_COPY;

export function tutorialCopy(id: TutorialCopyId): TutorialCopy {
  return TUTORIAL_COPY[id];
}
