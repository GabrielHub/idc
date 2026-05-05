import { companyGoalSchema, memberRequestSchema } from "../../domain/game";
import { starterCompanyGoals } from "./company-goals";
import { starterMemberRequests } from "./member-requests";

export const companyGoals = companyGoalSchema.array().min(2).parse(starterCompanyGoals);

export const memberRequests = memberRequestSchema.array().min(3).parse(starterMemberRequests);

export { starterCompanyGoals, starterMemberRequests };
