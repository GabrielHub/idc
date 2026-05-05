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
    id: "goal-one-good-date",
    title: "File 1 good date outcome",
    description: "Cupid would like one report that does not use the phrase containment bucket.",
    metric: "positiveOutcomeDates",
    target: 1,
    tags: ["outcome", "shift"],
  },
  {
    id: "goal-two-happier-members",
    title: "Make 2 members happier",
    description:
      "Member Mood is not technically payroll. Payroll has asked us to stop saying that.",
    metric: "improvedMembers",
    target: 2,
    tags: ["mood", "shift"],
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
