export type ManagerQuipCadence = "rare" | "regular" | "episodic";

export type ManagerQuipTriggerKey =
  | "onboarding.welcome"
  | "shift.started"
  | "shift.ended"
  | "date.started"
  | "date.ended"
  | "date.ended-early"
  | "date.outcome.bad-fit"
  | "date.outcome.cool-down"
  | "date.outcome.encourage"
  | "pair.trajectory.brittle"
  | "pair.closure.confirmed"
  | "member.retention.warning"
  | "member.status.quit"
  | "datebook.commit.over-budget"
  | "campaign.closures.five"
  | "focus.swap.first";

export interface ManagerQuipTriggerGroup {
  key: ManagerQuipTriggerKey;
  label: string;
  summary: string;
  cadence: ManagerQuipCadence;
}

export const MANAGER_RETENTION_WARNING_THRESHOLD = 25;

export const MANAGER_QUIP_TRIGGER_GROUPS: ManagerQuipTriggerGroup[] = [
  {
    key: "onboarding.welcome",
    label: "Onboarding welcome",
    summary:
      "First load on a fresh save. Fires alongside the very first coach mark to introduce the agency.",
    cadence: "rare",
  },
  {
    key: "shift.started",
    label: "Shift started",
    summary: "Doors open on a new shift. The manager arrives back at the desk.",
    cadence: "regular",
  },
  {
    key: "shift.ended",
    label: "Shift ended",
    summary: "Player punched out for the night. The lights come down.",
    cadence: "regular",
  },
  {
    key: "date.started",
    label: "Date started",
    summary: "Pair was just committed and the player walked them into the room.",
    cadence: "regular",
  },
  {
    key: "date.ended",
    label: "Date wrapped",
    summary: "The date played out fully and the final report is on screen.",
    cadence: "regular",
  },
  {
    key: "date.ended-early",
    label: "Date ended early",
    summary: "A walkout or a hard stop ended the date before the wrap turn.",
    cadence: "episodic",
  },
  {
    key: "date.outcome.bad-fit",
    label: "Outcome, bad fit",
    summary: "Wrap landed on bad fit. Pair is getting archived.",
    cadence: "regular",
  },
  {
    key: "date.outcome.cool-down",
    label: "Outcome, cool down",
    summary: "Wrap landed on cool down. Player files the follow-up.",
    cadence: "regular",
  },
  {
    key: "date.outcome.encourage",
    label: "Outcome, encourage",
    summary: "Wrap landed on encourage. The file gets a green stamp.",
    cadence: "regular",
  },
  {
    key: "pair.trajectory.brittle",
    label: "Pair turns brittle",
    summary: "Trajectory service flagged the pair as brittle after the wrap.",
    cadence: "episodic",
  },
  {
    key: "pair.closure.confirmed",
    label: "Closure confirmed",
    summary: "Player confirmed a closure. Two slots opened on the roster.",
    cadence: "regular",
  },
  {
    key: "member.retention.warning",
    label: `Retention below ${MANAGER_RETENTION_WARNING_THRESHOLD}`,
    summary: "A focused case dipped into the danger zone after a date.",
    cadence: "regular",
  },
  {
    key: "member.status.quit",
    label: "Member quit",
    summary: "Retention hit zero. Member exits the roster.",
    cadence: "rare",
  },
  {
    key: "datebook.commit.over-budget",
    label: "Commit blocked, over budget",
    summary: "Planning dock is blocked because the Date Book is over budget.",
    cadence: "episodic",
  },
  {
    key: "campaign.closures.five",
    label: "Soft win, five closures",
    summary: "Closure counter crossed five. Promotion cutscene.",
    cadence: "rare",
  },
  {
    key: "focus.swap.first",
    label: "First focus swap",
    summary: "Player dropped a focus case for the first time, paying the retention penalty.",
    cadence: "rare",
  },
];

export const MANAGER_QUIP_TRIGGER_GROUP_BY_KEY: Readonly<
  Record<ManagerQuipTriggerKey, ManagerQuipTriggerGroup>
> = Object.freeze(
  MANAGER_QUIP_TRIGGER_GROUPS.reduce<Record<ManagerQuipTriggerKey, ManagerQuipTriggerGroup>>(
    (acc, group) => {
      acc[group.key] = group;
      return acc;
    },
    {} as Record<ManagerQuipTriggerKey, ManagerQuipTriggerGroup>,
  ),
);

export type ManagerQuipStatus = "draft" | "recorded";

export interface ManagerQuip {
  id: string;
  triggerKey: ManagerQuipTriggerKey;
  text: string;
  translation?: string;
  generationScript?: string;
  audio: string;
  status: ManagerQuipStatus;
}

export const MANAGER_QUIP_CATALOG: ManagerQuip[] = [
  {
    id: "onboarding-welcome-01",
    triggerKey: "onboarding.welcome",
    text: "Okay. New hire. Welcome to Cupid Incorporated. I run the floor, you run the files. Job's simple. Pick four cases, draft a date book, send pairs into rooms. If it works, we file it. If it doesn't, also paperwork. Either way I'm clocking out at six.",
    generationScript:
      "[casual] Okay. New hire. [light chuckle] Welcome to Cupid Incorporated. I run the floor, you run the files. Job's simple. Pick four cases, draft a date book, send pairs into rooms. If it works, we file it. [sarcastic] If it doesn't, also paperwork. [tired] Either way I'm clocking out at six.",
    audio: "/assets/manager-quips/onboarding-welcome-01.mp3",
    status: "recorded",
  },
  {
    id: "shift-started-01",
    triggerKey: "shift.started",
    text: "Coffee's brewing. The audacity of this day to start again.",
    generationScript:
      "[tired] Coffee's brewing. [sarcastic] The audacity of this day to start again.",
    audio: "/assets/manager-quips/shift-started-01.mp3",
    status: "draft",
  },
  {
    id: "shift-started-02",
    triggerKey: "shift.started",
    text: "Doors are open. Try to remember how stairs work.",
    generationScript: "[casual] Doors are open. [deadpan] Try to remember how stairs work.",
    audio: "/assets/manager-quips/shift-started-02.mp3",
    status: "draft",
  },
  {
    id: "shift-started-03",
    triggerKey: "shift.started",
    text: "Round two. I checked my horoscope. It said betrayal.",
    generationScript: "[casual] Round two. I checked my horoscope. [deadpan] It said betrayal.",
    audio: "/assets/manager-quips/shift-started-03.mp3",
    status: "draft",
  },
  {
    id: "shift-started-04",
    triggerKey: "shift.started",
    text: "Morning. Statistically, half of these will end in tears.",
    generationScript:
      "[deadpan] Morning. [resigned tone] Statistically, half of these will end in tears.",
    audio: "/assets/manager-quips/shift-started-04.mp3",
    status: "draft",
  },
  {
    id: "shift-ended-01",
    triggerKey: "shift.ended",
    text: "Clocking out. If anyone needs me, they can need me tomorrow.",
    generationScript:
      "[tired] Clocking out. [casual] If anyone needs me, they can need me tomorrow.",
    audio: "/assets/manager-quips/shift-ended-01.mp3",
    status: "draft",
  },
  {
    id: "shift-ended-02",
    triggerKey: "shift.ended",
    text: "Lying face down on the floor. Calling that self care.",
    generationScript: "[deadpan] Lying face down on the floor. [casual] Calling that self care.",
    audio: "/assets/manager-quips/shift-ended-02.mp3",
    status: "draft",
  },
  {
    id: "shift-ended-03",
    triggerKey: "shift.ended",
    text: "Done. The members can love each other on their own time.",
    generationScript:
      "[resigned tone] Done. [casual] The members can love each other on their own time.",
    audio: "/assets/manager-quips/shift-ended-03.mp3",
    status: "draft",
  },
  {
    id: "shift-ended-04",
    triggerKey: "shift.ended",
    text: "Bye. Don't text me. Don't email me. Don't manifest me.",
    generationScript:
      "[deadpan] Bye. Don't text me. Don't email me. [sarcastic] Don't manifest me.",
    audio: "/assets/manager-quips/shift-ended-04.mp3",
    status: "draft",
  },
  {
    id: "date-start-01",
    triggerKey: "date.started",
    text: "Pair's in. Try not to embarrass me.",
    generationScript: "[casual] Pair's in. [sarcastic] Try not to embarrass me.",
    audio: "/assets/manager-quips/date-start-01.mp3",
    status: "recorded",
  },
  {
    id: "date-start-02",
    triggerKey: "date.started",
    text: "Doors shut. Magic happens, allegedly.",
    generationScript: "[deadpan] Doors shut. [sarcastic] Magic happens... allegedly.",
    audio: "/assets/manager-quips/date-start-02.mp3",
    status: "recorded",
  },
  {
    id: "date-start-03",
    triggerKey: "date.started",
    text: "Booked. Wake me when it gets interesting.",
    generationScript: "[tired] Booked. Wake me when it gets interesting.",
    audio: "/assets/manager-quips/date-start-03.mp3",
    status: "recorded",
  },
  {
    id: "date-start-04",
    triggerKey: "date.started",
    text: "Okay. Rolling tape. Let's see what they ruin first.",
    generationScript: "[casual] Okay. Rolling tape. [deadpan] Let's see what they ruin first.",
    audio: "/assets/manager-quips/date-start-04.mp3",
    status: "recorded",
  },
  {
    id: "date-start-05",
    triggerKey: "date.started",
    text: "两个人，一间房，我去喝杯咖啡。",
    translation: "Two people, one room. I'm going for a coffee.",
    generationScript: "[casual] 两个人，一间房，我去喝杯咖啡。",
    audio: "/assets/manager-quips/date-start-05.mp3",
    status: "recorded",
  },
  {
    id: "date-end-01",
    triggerKey: "date.ended",
    text: "And we're done. Try to look surprised.",
    generationScript: "[deadpan] And we're done. [sarcastic] Try to look surprised.",
    audio: "/assets/manager-quips/date-end-01.mp3",
    status: "recorded",
  },
  {
    id: "date-end-02",
    triggerKey: "date.ended",
    text: "Date's wrapped. Follow-up's your problem now.",
    generationScript: "[tired] Date's wrapped. Follow-up's your problem now.",
    audio: "/assets/manager-quips/date-end-02.mp3",
    status: "recorded",
  },
  {
    id: "date-end-03",
    triggerKey: "date.ended",
    text: "Curtain. Read the room, file accordingly.",
    generationScript: "[deadpan] Curtain. [casual] Read the room, file accordingly.",
    audio: "/assets/manager-quips/date-end-03.mp3",
    status: "recorded",
  },
  {
    id: "date-end-04",
    triggerKey: "date.ended",
    text: "Show's over. Pretend you were paying attention.",
    generationScript: "[sarcastic] Show's over. Pretend you were paying attention.",
    audio: "/assets/manager-quips/date-end-04.mp3",
    status: "recorded",
  },
  {
    id: "date-end-05",
    triggerKey: "date.ended",
    text: "Se acabó. Ahora la parte aburrida: el papeleo.",
    translation: "It's over. Now the boring part: the paperwork.",
    generationScript: "[tired] Se acabó. [resigned tone] Ahora la parte aburrida: el papeleo.",
    audio: "/assets/manager-quips/date-end-05.mp3",
    status: "recorded",
  },
  {
    id: "date-early-01",
    triggerKey: "date.ended-early",
    text: "Cut short. Could be efficiency, could be a bailout.",
    generationScript: "[casual] Cut short. Could be efficiency... could be a bailout.",
    audio: "/assets/manager-quips/date-early-01.mp3",
    status: "recorded",
  },
  {
    id: "date-early-02",
    triggerKey: "date.ended-early",
    text: "Off the clock early. Read the file before you panic.",
    generationScript: "[deadpan] Off the clock early. Read the file before you panic.",
    audio: "/assets/manager-quips/date-early-02.mp3",
    status: "recorded",
  },
  {
    id: "date-early-03",
    triggerKey: "date.ended-early",
    text: "Early wrap. The sentiment column makes the call here.",
    generationScript: "[casual] Early wrap. The sentiment column makes the call here.",
    audio: "/assets/manager-quips/date-early-03.mp3",
    status: "recorded",
  },
  {
    id: "date-early-04",
    triggerKey: "date.ended-early",
    text: "And they bolted. We'll learn the why in the wrap-up. Or we won't.",
    generationScript:
      "[casual] And they bolted. [deadpan] We'll learn the why in the wrap-up. [resigned tone] Or we won't.",
    audio: "/assets/manager-quips/date-early-04.mp3",
    status: "draft",
  },
  {
    id: "bad-fit-01",
    triggerKey: "date.outcome.bad-fit",
    text: "Bad fit. Shocking, I know.",
    generationScript: "[deadpan] Bad fit. [sarcastic] Shocking, I know.",
    audio: "/assets/manager-quips/bad-fit-01.mp3",
    status: "recorded",
  },
  {
    id: "bad-fit-02",
    triggerKey: "date.outcome.bad-fit",
    text: "Yeah, no. Archiving that one.",
    generationScript: "[sighs] Yeah, no. Archiving that one.",
    audio: "/assets/manager-quips/bad-fit-02.mp3",
    status: "recorded",
  },
  {
    id: "bad-fit-03",
    triggerKey: "date.outcome.bad-fit",
    text: "Chemistry: zero. Filing it under tried.",
    generationScript: "[deadpan] Chemistry: zero. Filing it under tried.",
    audio: "/assets/manager-quips/bad-fit-03.mp3",
    status: "recorded",
  },
  {
    id: "bad-fit-04",
    triggerKey: "date.outcome.bad-fit",
    text: "I've watched paint dry with more chemistry than that. Archive it.",
    generationScript:
      "[deadpan] I've watched paint dry with more chemistry than that. [casual] Archive it.",
    audio: "/assets/manager-quips/bad-fit-04.mp3",
    status: "draft",
  },
  {
    id: "bad-fit-05",
    triggerKey: "date.outcome.bad-fit",
    text: "Two icebergs talking about the weather. We're done here.",
    generationScript:
      "[casual] Two icebergs talking about the weather. [resigned tone] We're done here.",
    audio: "/assets/manager-quips/bad-fit-05.mp3",
    status: "draft",
  },
  {
    id: "cool-down-01",
    triggerKey: "date.outcome.cool-down",
    text: "Sometimes the best move is the door.",
    generationScript: "[resigned tone] Sometimes the best move is the door.",
    audio: "/assets/manager-quips/cool-down-01.mp3",
    status: "recorded",
  },
  {
    id: "cool-down-02",
    triggerKey: "date.outcome.cool-down",
    text: "Give them a minute. Or six. Whatever.",
    generationScript: "[tired] Give them a minute. Or six. [deadpan] Whatever.",
    audio: "/assets/manager-quips/cool-down-02.mp3",
    status: "recorded",
  },
  {
    id: "cool-down-03",
    triggerKey: "date.outcome.cool-down",
    text: "Give them space. Resist the urge to poke it.",
    generationScript: "[casual] Give them space. Resist the urge to poke it.",
    audio: "/assets/manager-quips/cool-down-03.mp3",
    status: "recorded",
  },
  {
    id: "cool-down-04",
    triggerKey: "date.outcome.cool-down",
    text: "They need a nap and a snack. Toddler solutions, adult bills.",
    generationScript:
      "[tired] They need a nap and a snack. [deadpan] Toddler solutions, adult bills.",
    audio: "/assets/manager-quips/cool-down-04.mp3",
    status: "draft",
  },
  {
    id: "cool-down-05",
    triggerKey: "date.outcome.cool-down",
    text: "Let it cool like leftovers. Tomorrow it's a different soup.",
    generationScript:
      "[casual] Let it cool like leftovers. [understated] Tomorrow it's a different soup.",
    audio: "/assets/manager-quips/cool-down-05.mp3",
    status: "draft",
  },
  {
    id: "encourage-01",
    triggerKey: "date.outcome.encourage",
    text: "Green light. Book the next one before they overthink it.",
    generationScript: "[casual] Green light. Book the next one before they overthink it.",
    audio: "/assets/manager-quips/encourage-01.mp3",
    status: "recorded",
  },
  {
    id: "encourage-02",
    triggerKey: "date.outcome.encourage",
    text: "Don't let momentum die of paperwork.",
    generationScript: "[deadpan] Don't let momentum die of paperwork.",
    audio: "/assets/manager-quips/encourage-02.mp3",
    status: "recorded",
  },
  {
    id: "encourage-03",
    triggerKey: "date.outcome.encourage",
    text: "Encourage it is. Don't crash it with a follow-up nobody asked for.",
    generationScript:
      "[casual] Encourage it is. [deadpan] Don't crash it with a follow-up nobody asked for.",
    audio: "/assets/manager-quips/encourage-03.mp3",
    status: "recorded",
  },
  {
    id: "encourage-04",
    triggerKey: "date.outcome.encourage",
    text: "Green stamp. Haven't dusted this one off in a while.",
    generationScript:
      "[casual] Green stamp. [light chuckle] Haven't dusted this one off in a while.",
    audio: "/assets/manager-quips/encourage-04.mp3",
    status: "draft",
  },
  {
    id: "encourage-05",
    triggerKey: "date.outcome.encourage",
    text: "Sparks. The real kind. Get them out before they second-guess it.",
    generationScript:
      "[casual] Sparks. [emphasized] The real kind. [deadpan] Get them out before they second-guess it.",
    audio: "/assets/manager-quips/encourage-05.mp3",
    status: "draft",
  },
  {
    id: "brittle-01",
    triggerKey: "pair.trajectory.brittle",
    text: "Brittle. Be gentle. Or don't. Your call.",
    generationScript: "[deadpan] Brittle. Be gentle. [sarcastic] Or don't. Your call.",
    audio: "/assets/manager-quips/brittle-01.mp3",
    status: "recorded",
  },
  {
    id: "brittle-02",
    triggerKey: "pair.trajectory.brittle",
    text: "Trajectory's wobbling. Maybe ease off the dramatics.",
    generationScript: "[tired] Trajectory's wobbling. Maybe ease off the dramatics.",
    audio: "/assets/manager-quips/brittle-02.mp3",
    status: "recorded",
  },
  {
    id: "brittle-03",
    triggerKey: "pair.trajectory.brittle",
    text: "They're not okay. Soft room next, or we're writing the closure.",
    generationScript:
      "[resigned tone] They're not okay. Soft room next, or we're writing the closure.",
    audio: "/assets/manager-quips/brittle-03.mp3",
    status: "recorded",
  },
  {
    id: "brittle-04",
    triggerKey: "pair.trajectory.brittle",
    text: "These two are held together by lipstick and good manners.",
    generationScript:
      "[deadpan] These two are held together by lipstick... [understated] and good manners.",
    audio: "/assets/manager-quips/brittle-04.mp3",
    status: "draft",
  },
  {
    id: "brittle-05",
    triggerKey: "pair.trajectory.brittle",
    text: "Their bond is a Jenga tower at the bottom of the second drink.",
    generationScript:
      "[resigned tone] Their bond is a Jenga tower... [deadpan] at the bottom of the second drink.",
    audio: "/assets/manager-quips/brittle-05.mp3",
    status: "draft",
  },
  {
    id: "closure-confirmed-01",
    triggerKey: "pair.closure.confirmed",
    text: "Case closed. Somebody else's problem now.",
    generationScript: "[casual] Case closed. [deadpan] Somebody else's problem now.",
    audio: "/assets/manager-quips/closure-confirmed-01.mp3",
    status: "recorded",
  },
  {
    id: "closure-confirmed-02",
    triggerKey: "pair.closure.confirmed",
    text: "Another one bites the dust. Or, two I guess.",
    generationScript: "[deadpan] Another one bites the dust. [casual] Or, two I guess.",
    audio: "/assets/manager-quips/closure-confirmed-02.mp3",
    status: "recorded",
  },
  {
    id: "closure-confirmed-03",
    triggerKey: "pair.closure.confirmed",
    text: "Done. They get love, we don't get a raise.",
    generationScript: "[deadpan] Done. [resigned tone] They get love, we don't get a raise.",
    audio: "/assets/manager-quips/closure-confirmed-03.mp3",
    status: "recorded",
  },
  {
    id: "closure-confirmed-04",
    triggerKey: "pair.closure.confirmed",
    text: "Bye-bye lovebirds. Don't text me on Christmas.",
    generationScript: "[playfully] Bye-bye lovebirds. [deadpan] Don't text me on Christmas.",
    audio: "/assets/manager-quips/closure-confirmed-04.mp3",
    status: "draft",
  },
  {
    id: "closure-confirmed-05",
    triggerKey: "pair.closure.confirmed",
    text: "Closure. The good kind, where I get my evenings back.",
    generationScript: "[deadpan] Closure. [casual] The good kind, where I get my evenings back.",
    audio: "/assets/manager-quips/closure-confirmed-05.mp3",
    status: "draft",
  },
  {
    id: "retention-warn-01",
    triggerKey: "member.retention.warning",
    text: "Um, they're one oxford comma from packing it in?",
    generationScript: "[hesitates] Um, they're one oxford comma from packing it in?",
    audio: "/assets/manager-quips/retention-warn-01.mp3",
    status: "recorded",
  },
  {
    id: "retention-warn-02",
    triggerKey: "member.retention.warning",
    text: "Retention's tanking. Pick something soft next.",
    generationScript: "[casual] Retention's tanking. Pick something soft next.",
    audio: "/assets/manager-quips/retention-warn-02.mp3",
    status: "recorded",
  },
  {
    id: "retention-warn-03",
    triggerKey: "member.retention.warning",
    text: "Twenty-five and dropping. Read the room.",
    generationScript: "[deadpan] Twenty-five and dropping. Read the room.",
    audio: "/assets/manager-quips/retention-warn-03.mp3",
    status: "recorded",
  },
  {
    id: "retention-warn-04",
    triggerKey: "member.retention.warning",
    text: "If their morale was a houseplant, I'd be calling poison control.",
    generationScript:
      "[tired] If their morale was a houseplant... [deadpan] I'd be calling poison control.",
    audio: "/assets/manager-quips/retention-warn-04.mp3",
    status: "draft",
  },
  {
    id: "retention-warn-05",
    triggerKey: "member.retention.warning",
    text: "One bad room from updating their LinkedIn. Pick soft, please.",
    generationScript:
      "[casual] One bad room from updating their LinkedIn. [tired] Pick soft, please.",
    audio: "/assets/manager-quips/retention-warn-05.mp3",
    status: "draft",
  },
  {
    id: "member-quit-01",
    triggerKey: "member.status.quit",
    text: "Keep this up and I'm picking up smoking again.",
    generationScript: "[frustrated] Keep this up and I'm picking up smoking again.",
    audio: "/assets/manager-quips/member-quit-01.mp3",
    status: "recorded",
  },
  {
    id: "member-quit-02",
    triggerKey: "member.status.quit",
    text: "I know the job application said I don't bite. I'm gonna bite.",
    generationScript:
      "[deadpan] I know the job application said I don't bite. [angrily, fed up] I'm gonna bite.",
    audio: "/assets/manager-quips/member-quit-02.mp3",
    status: "recorded",
  },
  {
    id: "member-quit-03",
    triggerKey: "member.status.quit",
    text: "I hate to see them leave, but I love to watch that ass.",
    generationScript: "[playfully] I hate to see them leave, but I love to watch that ass.",
    audio: "/assets/manager-quips/member-quit-03.mp3",
    status: "recorded",
  },
  {
    id: "over-budget-01",
    triggerKey: "datebook.commit.over-budget",
    text: "Stop asking me if we have the money. We don't have the money.",
    generationScript:
      "[frustrated] Stop asking me if we have the money. [deadpan] We don't have the money.",
    audio: "/assets/manager-quips/over-budget-01.mp3",
    status: "recorded",
  },
  {
    id: "over-budget-02",
    triggerKey: "datebook.commit.over-budget",
    text: "Numbers don't math. Take something off.",
    generationScript: "[tired] Numbers don't math. Take something off.",
    audio: "/assets/manager-quips/over-budget-02.mp3",
    status: "recorded",
  },
  {
    id: "over-budget-03",
    triggerKey: "datebook.commit.over-budget",
    text: "You're broke. You, not we. Fix it.",
    generationScript: "[deadpan] You're broke. You, NOT we. Fix it.",
    audio: "/assets/manager-quips/over-budget-03.mp3",
    status: "recorded",
  },
  {
    id: "over-budget-04",
    triggerKey: "datebook.commit.over-budget",
    text: "I don't need a calculator to know we're over budget.",
    generationScript: "[sarcastic] I don't need a calculator to know we're over budget.",
    audio: "/assets/manager-quips/over-budget-04.mp3",
    status: "recorded",
  },
  {
    id: "over-budget-05",
    triggerKey: "datebook.commit.over-budget",
    text: "My money doesn't jiggle jiggle. It folds.",
    generationScript: "[playfully] My money doesn't jiggle jiggle. [deadpan] It folds.",
    audio: "/assets/manager-quips/over-budget-05.mp3",
    status: "recorded",
  },
  {
    id: "soft-win-01",
    triggerKey: "campaign.closures.five",
    text: "Five down. Five fewer people emailing me. When are we making the sequel?",
    generationScript:
      "[casual] Five down. Five fewer people emailing me. [playfully] When are we making the sequel?",
    audio: "/assets/manager-quips/soft-win-01.mp3",
    status: "recorded",
  },
  {
    id: "soft-win-02",
    triggerKey: "campaign.closures.five",
    text: "The devil's greatest trick was convincing all of you that nuts produce milk.",
    generationScript:
      "[deadpan] The devil's greatest trick was convincing all of you that nuts produce milk.",
    audio: "/assets/manager-quips/soft-win-02.mp3",
    status: "recorded",
  },
  {
    id: "first-swap-01",
    triggerKey: "focus.swap.first",
    text: "Don't worry, they can't hurt you anymore. Though if you keep this up I will.",
    generationScript:
      "[casual] Don't worry, they can't hurt you anymore. [deadpan] Though if you keep this up I will.",
    audio: "/assets/manager-quips/first-swap-01.mp3",
    status: "recorded",
  },
];

export const MANAGER_QUIP_IDS: readonly string[] = MANAGER_QUIP_CATALOG.map((quip) => quip.id);

export function getManagerQuipById(id: string): ManagerQuip | undefined {
  return MANAGER_QUIP_CATALOG.find((quip) => quip.id === id);
}

export function getManagerQuipsForTrigger(triggerKey: ManagerQuipTriggerKey): ManagerQuip[] {
  return MANAGER_QUIP_CATALOG.filter((quip) => quip.triggerKey === triggerKey);
}
