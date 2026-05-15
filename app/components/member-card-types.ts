import type { Ref } from "react";

import type { Member, PlayerKnowledgeRecord } from "../domain/game";
import type { MemberCardPill } from "./member-card-atoms";

export type MemberCardState = "default" | "focused" | "selected" | "disabled" | "closed" | "quit";

export type MemberCardDensity = "standard" | "compact";

export type MemberCardProps = {
  member: Member;
  state?: MemberCardState;
  density?: MemberCardDensity;
  playerKnowledge?: readonly PlayerKnowledgeRecord[];
  revealAllDetails?: boolean;
  fileNumber?: string;
  priorityIndex?: number;
  askPreview?: string;
  statusPill?: MemberCardPill;
  blurbOverride?: string;
  hideSealedSummary?: boolean;
  index?: number;
  disabled?: boolean;
  cardRef?: Ref<HTMLLIElement>;
  expandButtonRef?: Ref<HTMLButtonElement>;
  onClick?: () => void;
  onExpand?: () => void;
};
