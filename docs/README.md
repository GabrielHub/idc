# Documentation

Code, tests, fixtures, and assets are the source of truth for implemented behavior. Docs explain the contract and the repeatable procedures that keep content changes from drifting.

## Map

- `product/`: durable product contracts. These docs describe what must be true in the shipped game.
- `workflows/`: repeatable procedures. These docs describe how to make a content, release, or engineering change.
- `support/`: player and operator support guides.
- `proposals/`: draft plans and parked ideas. A proposal is not source of truth until the accepted behavior is reflected in code, tests, fixtures, assets, and the relevant product docs.

## Product Docs

- `product/gameplay-traits.md`: hidden member tags, request tags, player knowledge, match fit, focus cases, closures, and roster chemistry pressure.
- `product/voice.md`: IDC tone, prose mechanics, comedic engines, member voice patterns, scenario event kinds, and LLM prompt voice rules.
- `product/visual-design.md`: Aura interface direction, Tailwind token usage, member chat bubbles, member auras, canvas layout, and scenario card UI.
- `product/image-style.md`: portrait style, portrait canvas contract, prompt construction, cutout pipeline, scenario background style, and asset acceptance checks.

## Workflow Docs

- `workflows/add-member.md`: the content checklist for adding one member fixture, member requests, chemistry map entries, and nonvisual validation.
- `workflows/add-date-scenario.md`: the content checklist for adding one date scenario fixture, event set, registration, and nonvisual validation.
- `workflows/visual-asset-iteration.md`: the independent image-capable workflow for member portraits, variants, and scenario backgrounds.
- `workflows/release-checklist.md`: friend-share desktop prerelease procedure.

## Support Docs

- `support/desktop-install-guide.md`: player install flow, provider setup, update behavior, save paths, logs, and caveats.
- `support/release-readme.md`: short player-facing install notes for GitHub release assets.

## Ownership Rules

Product docs should state rules and constraints. Short implementation notes are acceptable when they define an asset or schema contract. Ordered task checklists belong in workflows.

Workflow docs should state ordered steps, required files, and validation commands. They should link to product docs for the rule behind each step.

Support docs should speak to the person installing or operating the app. They should avoid internal implementation detail unless it affects setup, data, or troubleshooting.

When a change alters a schema, fixture contract, game system, visual surface, prompt rule, or shipped asset requirement, update both the product doc that owns the rule and any workflow that depends on it.
