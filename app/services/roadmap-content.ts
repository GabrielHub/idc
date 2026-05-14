import { listRawDocModules } from "./docs-content";

export type RoadmapPlanStatus =
  | "drafting"
  | "ready"
  | "in-flight"
  | "review"
  | "blocked"
  | "shipped"
  | "shelved";

export interface RoadmapPlanMeta {
  status: RoadmapPlanStatus;
  opened: string;
  touched: string;
  owner?: string;
  tldr: string;
  tasks: number;
  done: number;
  blockedReason?: string;
  shippedAt?: string;
  shelvedReason?: string;
  dependencies?: string[];
  tags?: string[];
}

export interface RoadmapPlan {
  slug: string;
  title: string;
  description: string;
  plan: RoadmapPlanMeta;
}

export const STATUS_ORDER: RoadmapPlanStatus[] = [
  "review",
  "in-flight",
  "blocked",
  "ready",
  "drafting",
  "shipped",
  "shelved",
];

export const STATUS_LABEL: Record<RoadmapPlanStatus, string> = {
  drafting: "drafting",
  ready: "ready",
  "in-flight": "in flight",
  review: "review",
  blocked: "blocked",
  shipped: "shipped",
  shelved: "shelved",
};

function isRoadmapPlanMeta(value: unknown): value is RoadmapPlanMeta {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RoadmapPlanMeta>;
  return typeof candidate.status === "string" && typeof candidate.tldr === "string";
}

let cachedPlans: RoadmapPlan[] | null = null;

function getRoadmapPlans(): RoadmapPlan[] {
  if (cachedPlans) {
    return cachedPlans;
  }

  cachedPlans = listRawDocModules()
    .filter((module) => module.meta.group === "roadmap" && isRoadmapPlanMeta(module.plan))
    .map((module) => ({
      slug: module.meta.slug,
      title: module.meta.title,
      description: module.meta.description,
      plan: module.plan as RoadmapPlanMeta,
    }))
    .sort((a, b) => {
      const ao = STATUS_ORDER.indexOf(a.plan.status);
      const bo = STATUS_ORDER.indexOf(b.plan.status);
      if (ao !== bo) return ao - bo;
      return b.plan.touched.localeCompare(a.plan.touched);
    });

  return cachedPlans;
}

export function listRoadmapPlans(): RoadmapPlan[] {
  return getRoadmapPlans();
}

export function countByStatus(): Record<RoadmapPlanStatus, number> {
  const counts: Record<RoadmapPlanStatus, number> = {
    drafting: 0,
    ready: 0,
    "in-flight": 0,
    review: 0,
    blocked: 0,
    shipped: 0,
    shelved: 0,
  };
  for (const plan of getRoadmapPlans()) {
    counts[plan.plan.status] += 1;
  }
  return counts;
}

export function plansByStatus(): Record<RoadmapPlanStatus, RoadmapPlan[]> {
  const groups: Record<RoadmapPlanStatus, RoadmapPlan[]> = {
    drafting: [],
    ready: [],
    "in-flight": [],
    review: [],
    blocked: [],
    shipped: [],
    shelved: [],
  };
  for (const plan of getRoadmapPlans()) {
    groups[plan.plan.status].push(plan);
  }
  return groups;
}
