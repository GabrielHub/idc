import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "alternate icon", href: "/favicon.ico", sizes: "any" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let badge = "system notice";
  let message = "Cupid hit an unexpected error.";
  let details = "Reload the shell. If this keeps happening, capture the log folder for triage.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      badge = "404 // route not found";
      message = "Cupid does not have a desk for that route.";
      details = "The requested page is not in the current routing table. Punch back to the shell.";
    } else {
      badge = `${error.status} // route error`;
      message = "Cupid could not file that route.";
      details =
        error.statusText ||
        "The route returned an unexpected status. Reload the shell or punch back to the dashboard.";
    }
  } else if (import.meta.env.DEV && error instanceof Error) {
    badge = "dev // error";
    message = "Cupid hit a runtime error.";
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="relative min-h-screen overflow-x-clip bg-aura-bg text-aura-ink">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 size-[420px] rounded-full bg-aura-mesh-rose/35 blur-[140px]" />
        <div className="absolute -bottom-24 right-0 size-[420px] rounded-full bg-aura-mesh-violet/35 blur-[140px]" />
      </div>
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
        <div className="aura-glass-strong rounded-card p-8 shadow-card lg:p-10">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
            {badge}
          </p>
          <h1 className="mt-3 font-display text-display-lg font-semibold leading-[1.05] tracking-tight text-aura-ink">
            {message}
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
          </div>
          {stack === undefined ? null : (
            <pre className="mt-6 max-h-72 overflow-auto rounded-tile border border-aura-hairline bg-aura-paper p-4 font-mono text-micro leading-relaxed text-aura-muted">
              <code>{stack}</code>
            </pre>
          )}
        </div>
      </section>
    </main>
  );
}
