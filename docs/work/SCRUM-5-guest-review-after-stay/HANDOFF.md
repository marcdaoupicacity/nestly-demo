# Handoff log — SCRUM-5

## plan — 2026-11-11T00:04:21Z
Read: Jira SCRUM-5 (https://marc7182.atlassian.net/browse/SCRUM-5), codebase-analyst report
Wrote: intent.md, status.json
Commit: 81aff90
Summary: Guests review completed paid stays; DB-enforced one review per booking, ratings recomputed by trigger on top of seeded baseline. Includes fixing the bookings insert policy hole that would bypass the gate.
Next: design — reads intent.md

## design — 2026-11-11T00:10:50Z
Read: intent.md
Wrote: spec.md, status.json (Figma: https://www.figma.com/design/d3FvJD9PjvxRRUqAnxD5c0)
Commit: be69df0
Summary: Direction A (inline Trips button + AuthModal-style review modal, 2-col reviews grid on listing). New reviews table with RLS + fill/recompute triggers, listings base_rating columns, bookings insert policy tightened. 9 requirements, all SCs traced.
Next: build — reads spec.md, writes plan.md
