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

## build — 2026-11-11T00:15:27Z
Read: spec.md
Wrote: plan.md (2c41f42), code (WP1 db, WP2 write path, WP3 read path), PR #1
Commit: fd3bc6a
Summary: 3 implementers in parallel on disjoint files; integrated, build+lint clean, code-reviewer APPROVE (non-blocking fixes applied: exact review count, embed typing). PR https://github.com/marcdaoupicacity/nestly-demo/pull/1
Next: test — reads spec.md + plan.md, writes test-report.md

## test — 2026-11-11T00:19:00Z
Read: intent.md, spec.md, plan.md, HANDOFF.md
Wrote: test-report.md, screens/*.png
Commit: 97684a8
Summary: build + lint PASS (6 baseline warnings), no unit runner. Playwright smoke PASS on home cards, listing #reviews section + anchor scroll (graceful "No reviews yet" with expected 404 on missing reviews table), /trips logged-out prompt. DB-dependent SC3/SC4/SC6 and data parts of SC1/SC5 deferred by user to post-migration SQL checks; SC2 not verified (no login).
Next: deploy — apply migration, then run scrum5_reviews_rls.sql + advisors and recheck listing page for the 404

## deploy — 2026-11-11T00:20:54Z
Read: test-report.md, plan.md
Wrote: deploy-log.md
Commit: e5d161e
Summary: Migration reviews applied to staybnb-demo; RLS checks (a)-(f) all PASS; advisors clean except new INFO unindexed FK reviews.user_id. Vercel production https://nestly-demo.vercel.app (dpl_BKzJzhCvQeEtfQZzjLKoerCmCsgU) READY, reviews endpoint 200.
Next: maintain (reads deploy-log.md)
