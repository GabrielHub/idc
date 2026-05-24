/**
 * Constellation lobby math barrel. Re-exports world-space helpers, role and
 * cohort resolution, and per-role render helpers. Each focused module owns
 * its slice of the domain:
 *
 *   - math-world: position, camera, slab Z, cluster layouts, archive fit
 *   - math-roles: roles, cohorts, layer arithmetic
 *   - math-render: per-role sizing, intensity, ring/halo color, srcset
 *
 * Member-facing text formatters (profile snippet, height) moved to
 * `app/services/member-display.ts` so they're reusable outside the lobby.
 */

export * from "./math-world";
export * from "./math-roles";
export * from "./math-render";
