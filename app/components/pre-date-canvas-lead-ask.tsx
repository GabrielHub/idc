import type { Member, MemberRequest } from "../domain/game";

export function LeadAskBanner({
  focus,
  request,
  leadRequestId,
}: {
  focus: Member | null;
  request: MemberRequest | undefined;
  leadRequestId: string | undefined;
}) {
  const isLead = request !== undefined && request.id === leadRequestId;
  const askLabel = isLead ? "lead ask" : request === undefined ? "no ask on file" : "queued ask";
  const labelTone = isLead ? "text-aura-rose" : "text-aura-faint";

  return (
    <section
      aria-label="Tonight's case"
      className="aura-glass mt-5 rounded-card border border-aura-rose/15 px-5 py-4 shadow-quiet"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
            // tonight's case
          </p>
          {focus === null ? (
            <p className="mt-1 text-label leading-snug text-aura-muted">
              Pick a lead case to anchor tonight's booking.
            </p>
          ) : request === undefined ? (
            <p className="mt-1 text-label leading-snug text-aura-ink">
              <span className="font-display font-semibold tracking-tight">{focus.firstName}</span>{" "}
              <span className="text-aura-muted">has no active ask on file.</span>
            </p>
          ) : (
            <p className="mt-1 text-label leading-snug text-aura-ink">
              <span className="font-display font-semibold tracking-tight">{focus.firstName}</span>{" "}
              needs{" "}
              <span className="font-semibold text-aura-ink/95">
                {stripTrailingPeriod(request.text)}
              </span>
              .
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-pill bg-white/70 px-2.5 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] ring-1 ring-aura-hairline ${labelTone}`}
        >
          {askLabel}
        </span>
      </div>
    </section>
  );
}

function stripTrailingPeriod(text: string): string {
  return text.replace(/[.!?]+$/, "");
}
