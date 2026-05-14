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
import { RendererCrashPanel, RendererErrorBoundary } from "./components/renderer-error-boundary";

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
  return (
    <RendererErrorBoundary>
      <Outlet />
    </RendererErrorBoundary>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let badge = "system notice";
  let message = "Cupid hit an unexpected error.";
  let details = "Reload the shell. If this keeps happening, save one bug report for triage.";
  let routeStatus: number | undefined;

  if (isRouteErrorResponse(error)) {
    routeStatus = error.status;

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
  } else if (error instanceof Error) {
    badge = "dev // error";
    message = "Cupid hit a runtime error.";
    details = error.message;
  }

  return (
    <RendererCrashPanel
      badge={badge}
      title={message}
      details={details}
      error={error}
      routeStatus={routeStatus}
    />
  );
}
