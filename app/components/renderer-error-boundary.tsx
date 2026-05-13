import { Component, type ErrorInfo, type ReactNode, useMemo, useState } from "react";

import { SAVE_SCHEMA_VERSION } from "../domain/game";
import { APP_VERSION } from "../platform/release-identity";
import { detectRuntimePlatform, isTauriRuntime } from "../platform/runtime";
import { openTauriLogFolder } from "../platform/tauri-log-folder";
import { errorToMessage } from "../services/utils";

type RendererErrorBoundaryProps = {
  children: ReactNode;
};

type RendererErrorBoundaryState = {
  error: Error | null;
  componentStack: string | null;
};

export class RendererErrorBoundary extends Component<
  RendererErrorBoundaryProps,
  RendererErrorBoundaryState
> {
  override state: RendererErrorBoundaryState = {
    error: null,
    componentStack: null,
  };

  static getDerivedStateFromError(error: Error): Partial<RendererErrorBoundaryState> {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("renderer error boundary caught", error, errorInfo);
    this.setState({ componentStack: errorInfo.componentStack ?? null });
  }

  override render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <RendererCrashPanel
          badge="renderer // crash report"
          title="Cupid lost the renderer."
          details="The desk is still here, but this window stopped filing forms. Copy the report, then reload."
          error={this.state.error}
          componentStack={this.state.componentStack}
        />
      );
    }

    return this.props.children;
  }
}

export function RendererCrashPanel({
  badge,
  title,
  details,
  error,
  componentStack,
  routeStatus,
}: {
  badge: string;
  title: string;
  details: string;
  error: unknown;
  componentStack?: string | null;
  routeStatus?: number;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const reportText = useMemo(
    () => buildCrashReportText({ error, componentStack, routeStatus }),
    [componentStack, error, routeStatus],
  );
  const stack = error instanceof Error ? error.stack : undefined;
  const canOpenLogs = isTauriRuntime();

  async function handleCopyReport() {
    setCopyError(null);

    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (copyFailure) {
      setCopyError(errorToMessage(copyFailure) || "Clipboard write failed.");
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-clip bg-aura-bg text-aura-ink">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 size-[420px] rounded-full bg-aura-mesh-rose/35 blur-[140px]" />
        <div className="absolute right-0 -bottom-24 size-[420px] rounded-full bg-aura-mesh-violet/35 blur-[140px]" />
      </div>
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
        <div className="aura-glass-strong rounded-card p-8 shadow-card lg:p-10">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
            {badge}
          </p>
          <h1 className="mt-3 font-display text-display-lg font-semibold leading-[1.05] tracking-tight text-aura-ink">
            {title}
          </h1>
          <p className="mt-4 text-lead leading-snug text-aura-muted">{details}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="/"
              className="inline-flex cursor-pointer items-center gap-2 rounded-pill bg-aura-ink px-5 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-cta transition hover:bg-aura-rose hover:shadow-cta-hover"
            >
              Reload shell
            </a>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-aura-hairline-strong bg-white/55 px-5 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-ink transition hover:bg-white"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void handleCopyReport()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-aura-hairline-strong bg-white/55 px-5 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-ink transition hover:bg-white"
            >
              {copied ? "Report copied" : "Copy report"}
            </button>
            {canOpenLogs ? (
              <button
                type="button"
                onClick={() => void openTauriLogFolder()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-aura-hairline-strong bg-white/55 px-5 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-ink transition hover:bg-white"
              >
                Show log folder
              </button>
            ) : null}
          </div>
          {copyError === null ? null : (
            <p className="mt-4 rounded-tile border border-aura-rose/30 bg-rose-50/75 px-3 py-2 text-label leading-relaxed text-aura-rose">
              Report copy failed: {copyError}
            </p>
          )}
          <pre className="mt-6 max-h-72 overflow-auto rounded-tile border border-aura-hairline bg-aura-paper p-4 font-mono text-micro leading-relaxed text-aura-muted">
            <code>{stack ?? reportText}</code>
          </pre>
        </div>
      </section>
    </main>
  );
}

function buildCrashReportText({
  error,
  componentStack,
  routeStatus,
}: {
  error: unknown;
  componentStack?: string | null;
  routeStatus?: number;
}): string {
  const report = {
    appVersion: APP_VERSION,
    saveSchema: SAVE_SCHEMA_VERSION,
    runtime: detectRuntimePlatform(),
    timestamp: new Date().toISOString(),
    url: typeof window === "undefined" ? "unknown" : window.location.href,
    userAgent: typeof navigator === "undefined" ? "unknown" : navigator.userAgent,
    routeStatus: routeStatus ?? null,
    message: errorToMessage(error) || "Unknown renderer error.",
    stack: error instanceof Error ? (error.stack ?? null) : null,
    componentStack: componentStack ?? null,
  };

  return JSON.stringify(report, null, 2);
}
