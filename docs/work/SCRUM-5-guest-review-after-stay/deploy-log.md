# Deploy log — SCRUM-5 (guest review after stay)

Branch: feat/SCRUM-5-guest-review-after-stay @ 2e0abeb · PR #1 (open) · Deployed: 2026-11-11T00:20:54Z

Targets (diff vs origin/main = plan.md): supabase migration 20261111120000_reviews.sql, vercel web/. Edge functions: none.

| Time (UTC) | Target | Tool | ID / URL | Result |
|---|---|---|---|---|
| 2026-11-11T00:20:54Z | Supabase project | list_migrations | staybnb-demo (htynufaunmwwdyryvrmr); remote had only 20261110233414 init_schema | OK |
| 2026-11-11T00:20:54Z | Migration | apply_migration name=reviews | 20261111120000_reviews.sql | OK |
| 2026-11-11T00:20:54Z | Post-migration RLS/trigger checks | execute_sql supabase/tests/scrum5_reviews_rls.sql (begin...rollback) | checks (a)-(f) | PASS all 6; verified no leftover test rows |
| 2026-11-11T00:20:54Z | Advisors security | get_advisors | - | Only pre-existing WARN auth_leaked_password_protection; nothing on reviews/listings/bookings |
| 2026-11-11T00:20:54Z | Advisors performance | get_advisors | - | New INFO: unindexed FK reviews_user_id_fkey (non-blocking, follow-up); pre-existing INFO unused indexes |
| 2026-11-11T00:20:54Z | Edge functions | - | none changed | SKIPPED |
| 2026-11-11T00:20:54Z | Vercel preview | vercel CLI deploy (no git integration on project) | dpl_6U6CQdxcT6tdjv26yuBk4TaqndRU · https://nestly-demo-fs8mx7hme-marc-daous-projects.vercel.app | READY |
| 2026-11-11T00:20:54Z | Preview smoke | web_fetch_vercel_url | / and /listings/570a02d3-... | 200 both (SSO-protected, client JS not exercised) |
| 2026-11-11T00:20:54Z | Promote | request_promote | dpl_6U6CQ... | 422 (preview-target deploy not promotable) -> used production deploy of same commit |
| 2026-11-11T00:20:54Z | Vercel production | vercel CLI deploy --prod | dpl_BKzJzhCvQeEtfQZzjLKoerCmCsgU · https://nestly-demo.vercel.app | READY |
| 2026-11-11T00:20:54Z | Production smoke | Playwright | /listings/570a02d3-... | rest/v1/listings 200, rest/v1/reviews 200 (no longer 404), 0 console errors |

Follow-up: add index on public.reviews(user_id) (performance advisor INFO).
