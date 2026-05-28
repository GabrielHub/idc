# Surface Gameplay Feedback Review - 2026-05-28

Reviewer pass against `app/docs/roadmap/surface-gameplay-feedback.tsx` while playtesting at
1920x1080 with Vercel AI Gateway and `deepseek/deepseek-v4-flash`.

## Fixed During Review

- Gateway live dates were blocked by the default embedding model. The app could appear ready, then
  fail on begin-date with `Embedding generation failed`. `google/gemini-embedding-2` returned a
  Gateway service-unavailable response during the test, while `openai/text-embedding-3-small`
  succeeded with the same key. The default and legacy save migration now use the working OpenAI
  embedding model.
- The expanded shift brief overlapped the third venue card in the pick-venue layer at 1920x1080.
  The venue panel now reserves right-side space on very wide screens so scenario cards remain
  readable while the brief is open.

## Gameplay Notes

- The new feedback surfaces help, but the player still has to infer the objective chain: pick lead,
  pick partner, commit, pick venue, draft scenes, advance beats, wait for Cupid reads, then file.
  The steps are individually labeled, but the campaign goal is still fragmented across shift brief,
  lead ask chips, footer status, and pair memory.
- The member detail card labels retention as `Confidence`. That is more player-friendly than the
  raw field name, but it hides the quit-risk connection unless the player hovers the label. Consider
  using `Confidence` in the label with `stay risk` or `quit risk` in the visible badge/callout copy.
- `lead ask waiting` in the live-date footer is useful but passive. During play it was not obvious
  what action would satisfy the ask or whether scene drops/nudges are the intended tools.
- The first DeepSeek exchange produced strong character voice. The cost is pacing: one manual
  advance took long enough that a player may think the UI is idle unless loading state is very
  explicit.
- The plan still has unreviewed or incomplete acceptance surfaces: member hover risk chip, open
  loops/unmet asks on the single-member hover card, and click-through at-risk member overlay.
  Treat those as remaining review gaps rather than shipped behavior.

## Follow-Up Candidates

- Add a compact "why this matters" line to the first time a player sees `lead ask waiting`.
- Make active generation visibly busy in the footer while a beat is running.
- Consider a post-date goal receipt that directly says which shift goals moved and which did not,
  alongside the pair/member stat deltas.
