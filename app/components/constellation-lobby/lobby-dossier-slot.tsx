import { useMemo } from "react";

import type { GameSave, Member } from "../../domain/game";
import type { PairBoardGraph } from "../pair-board-layout";
import { MemberArchiveShard } from "./member-archive-shard";
import { PairDossierShard } from "./pair-dossier-shard";
import type { ArchiveSelection } from "./types";

export function LobbyDossierSlot({
  save,
  memberById,
  archiveGraph,
  archiveSelection,
  committedPairId,
  readyClosurePairIds,
  onArchiveSelectionChange,
  onOpenNotes,
  onOpenClosure,
}: {
  save: GameSave;
  memberById: ReadonlyMap<string, Member>;
  archiveGraph: PairBoardGraph;
  archiveSelection: ArchiveSelection;
  committedPairId: string | null;
  readyClosurePairIds: ReadonlySet<string>;
  onArchiveSelectionChange: (next: ArchiveSelection) => void;
  onOpenNotes: (pairId: string) => void;
  onOpenClosure?: (pairId: string) => void;
}) {
  const archiveFocusedMember =
    archiveSelection?.kind === "member"
      ? (memberById.get(archiveSelection.memberId) ?? null)
      : null;
  const archiveFocusedIncidentEdges = useMemo(() => {
    if (archiveFocusedMember === null) return [];
    const edges = archiveGraph.incidentEdgesByNode.get(archiveFocusedMember.id) ?? [];
    return [...edges].sort((a, b) => b.latestNoteAt - a.latestNoteAt);
  }, [archiveFocusedMember, archiveGraph.incidentEdgesByNode]);
  const dossierPairId =
    archiveSelection?.kind === "pair" ? archiveSelection.pairId : committedPairId;

  if (archiveFocusedMember !== null) {
    return (
      <MemberArchiveShard
        focusMember={archiveFocusedMember}
        incidentEdges={archiveFocusedIncidentEdges}
        memberById={memberById}
        onSelectPair={(pairId) => onArchiveSelectionChange({ kind: "pair", pairId })}
      />
    );
  }

  if (dossierPairId === null) return null;

  return (
    <PairDossierShard
      pairId={dossierPairId}
      pairState={save.pairStates.find((p) => p.id === dossierPairId)}
      members={save.members}
      memories={save.memories}
      playerKnowledge={save.playerKnowledge}
      readyClosurePairIds={readyClosurePairIds}
      onOpenNotes={onOpenNotes}
      onOpenClosure={onOpenClosure}
    />
  );
}
