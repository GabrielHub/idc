import type { CompanyGoal } from "../../domain/game";

export const starterCompanyGoals: CompanyGoal[] = [
  {
    id: "goal-complete-three-dates",
    title: "Complete 3 dates this shift",
    description: "Cupid expects full slot use. Idle romance inventory creates paperwork.",
    metric: "completedDates",
    target: 3,
    tags: ["shift", "throughput"],
  },
  {
    id: "goal-ordinary-nonhuman-match",
    title: "Match one ordinary human with one obviously non-human member",
    description:
      "Cross-reality rapport remains a quarterly priority for reasons Legal has summarized.",
    metric: "ordinaryNonHumanDates",
    target: 1,
    tags: ["matching", "cross_reality"],
  },
  {
    id: "goal-prevent-early-end",
    title: "Prevent any date from ending early",
    description: "Date Health below floor creates incident tickets and a smell in the break room.",
    metric: "earlyEndedDates",
    target: 0,
    tags: ["stability", "date_health"],
  },
  {
    id: "goal-improve-member-mood",
    title: "Improve total Member Mood by 10",
    description: "Member Mood is a business metric. Cupid regrets that sentence.",
    metric: "memberMoodDelta",
    target: 10,
    tags: ["mood", "shift"],
  },
];
