import type { MemberRequest } from "../../domain/game";

export const starterMemberRequests: MemberRequest[] = [
  {
    id: "request-jenna-normal-date",
    memberId: "jenna-pike",
    text: "Jenna wants a date that does not involve prophecy, robes, or a server calling her by a future married name.",
    moodPenaltyIfIgnored: 6,
    tags: ["normal_date", "prophecy_averse"],
  },
  {
    id: "request-meridian-no-followups",
    memberId: "meridian-vale",
    text: "Meridian wants one evening where follow-up questions stop before testimony begins.",
    moodPenaltyIfIgnored: 5,
    tags: ["privacy", "quiet_date"],
  },
  {
    id: "request-vhool-seen",
    memberId: "vhool",
    text: "Vhool wants to be seen as more than an unknowable cosmic wound. They are bringing soup anyway.",
    moodPenaltyIfIgnored: 7,
    tags: ["cosmic", "sincerity"],
  },
  {
    id: "request-whiskers-career",
    memberId: "mr-whiskers",
    text: "Mr. Whiskers wants someone who respects his career and does not ask what the chair is for.",
    moodPenaltyIfIgnored: 5,
    tags: ["career", "respect"],
  },
  {
    id: "request-opal-no-prophecy",
    memberId: "opal-sunday",
    text: "Opal wants a date that does not imply the universe already RSVP'd for her.",
    moodPenaltyIfIgnored: 6,
    tags: ["prophecy_averse", "choice"],
  },
  {
    id: "request-gideon-name",
    memberId: "gideon-glass",
    text: "Gideon wants someone who remembers his name afterward. He has prepared himself for lamps to flicker either way.",
    moodPenaltyIfIgnored: 6,
    tags: ["memory", "care"],
  },
];
