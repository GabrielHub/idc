import { motion } from "motion/react";
import { useMemo, useState } from "react";

import type { Member } from "../domain/game";
import { FOCUS_CASE_LIMIT } from "../services/focus-cases";
import { buildVisibleMemberProfile } from "../services/player-knowledge";
import { GhostButton, Portrait, PrimaryButton } from "./dashboard-atoms";

export type OnboardingScreenProps = {
  members: Member[];
  onConfirm: (memberIds: string[]) => void;
};

export function OnboardingScreen({ members, onConfirm }: OnboardingScreenProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const eligibleMembers = useMemo(
    () => members.filter((member) => member.state.status === "active"),
    [members],
  );

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length === 0) return eligibleMembers;
    return eligibleMembers.filter((member) => {
      const profile = buildVisibleMemberProfile(member, []);
      const haystack = [member.firstName, member.name, ...profile.publicFragments]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [eligibleMembers, searchQuery]);

  function toggle(memberId: string) {
    setSelectedIds((current) => {
      if (current.includes(memberId)) {
        return current.filter((id) => id !== memberId);
      }
      if (current.length >= FOCUS_CASE_LIMIT) {
        return current;
      }
      return [...current, memberId];
    });
  }

  const canContinue = selectedIds.length === FOCUS_CASE_LIMIT;

  return (
    <div className="min-h-screen w-full bg-aura-cream-soft px-6 pb-32 pt-20 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 text-center">
          <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose">
            // onboarding.cases
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-aura-ink lg:text-5xl">
            Pick four cases to focus
          </h1>
          <p className="mt-4 text-body text-aura-muted">
            Cupid keeps four open case files at a time. Closed cases free a slot. Pick the four
            members whose love lives matter to you most right now.
          </p>
        </header>

        <div className="mb-6 flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Search the roster"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="aura-glass w-full max-w-md rounded-pill px-4 py-2 text-sm text-aura-ink placeholder:text-aura-faint focus:outline-none focus:ring-2 focus:ring-aura-rose/40"
          />
          <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
            {selectedIds.length} / {FOCUS_CASE_LIMIT} selected
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((member, index) => {
            const isSelected = selectedIds.includes(member.id);
            const slotFull = !isSelected && selectedIds.length >= FOCUS_CASE_LIMIT;
            const profile = buildVisibleMemberProfile(member, []);
            return (
              <motion.li
                key={member.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.3 }}
              >
                <button
                  type="button"
                  onClick={() => toggle(member.id)}
                  disabled={slotFull}
                  className={`group relative flex w-full cursor-pointer flex-col gap-2 overflow-hidden rounded-3xl border bg-white p-3 text-left text-aura-ink transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? "border-aura-rose/60 ring-2 ring-aura-rose/30 shadow-aura-soft"
                      : "border-aura-hairline hover:border-aura-rose/30 hover:shadow-aura-soft"
                  }`}
                  data-sfx="click"
                >
                  <div className="aspect-square overflow-hidden rounded-2xl bg-aura-cream">
                    <Portrait member={member} variant="card" />
                  </div>
                  <div className="px-1">
                    <h3 className="font-display text-sm font-semibold tracking-tight">
                      {member.firstName}
                    </h3>
                    {profile.publicFragments[0] !== undefined ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-aura-muted">
                        {profile.publicFragments[0]}
                      </p>
                    ) : null}
                  </div>
                  {isSelected ? (
                    <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-aura-rose text-xs font-semibold text-white shadow">
                      {selectedIds.indexOf(member.id) + 1}
                    </span>
                  ) : null}
                </button>
              </motion.li>
            );
          })}
        </ul>

        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-30 flex justify-center px-6">
          <div className="aura-glass-strong pointer-events-auto flex items-center gap-4 rounded-pill px-5 py-3 shadow-aura-soft">
            <GhostButton onClick={() => setSelectedIds([])} disabled={selectedIds.length === 0}>
              Clear
            </GhostButton>
            <PrimaryButton
              disabled={!canContinue}
              onClick={() => {
                if (canContinue) {
                  onConfirm(selectedIds);
                }
              }}
            >
              Open the office
              <span className="ml-2 inline-block">→</span>
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
