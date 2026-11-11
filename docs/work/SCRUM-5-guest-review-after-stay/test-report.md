# Test report: SCRUM-5 Guests can review completed stays
Branch: feat/SCRUM-5-guest-review-after-stay · Commit: 68d2b5a · PR: https://github.com/marcdaoupicacity/nestly-demo/pull/1 · Target: http://localhost:5173 (local dev, production Supabase) · Date: 2026-11-11T00:18Z · Iteration: 1/3

## Overall: PASS (for checks in scope; DB-dependent criteria deferred by user decision)

Scope note (user decision): DB tests skipped at this stage. `supabase/tests/scrum5_reviews_rls.sql` was not run and no Supabase write tool was called. The production DB does not yet have the `reviews` table. No login / account creation was performed.

## Static checks
| Check | Command | Result | Notes |
|---|---|---|---|
| Typecheck + build | npm run build | PASS | exit 0; only the pre-existing >500 kB chunk-size warning |
| Lint | npm run lint | PASS | exit 0; 6 warnings, all baseline (ListingDetail.tsx x3 purity, WishlistContext.tsx, Footer.tsx, Home.tsx) |
| Unit tests | npm test | no runner | no `test` script in web/package.json; plan.md did not add one |

## E2E smoke (Playwright MCP)
| # | Flow | Steps | Result | Evidence |
|---|---|---|---|---|
| 1 | Home cards | open / | PASS | 24 listing cards rendered with ratings (e.g. "4.98", "4.97"); 0 console errors. screens/home.png |
| 2 | Listing detail reviews | open /listings/6b56d02b-…; click "41 reviews" anchor | PASS | `#reviews` section present showing "4.98 · 41 reviews / No reviews yet"; click set hash #reviews, scrollY 0 -> 1106, section top at 112px. Page fully rendered. screens/listing-reviews.png |
| 3 | /trips logged out | open /trips | PASS | Shows "Log in to see your trips." with Log in button; 0 console errors. screens/trips-logged-out.png |

## Success criteria
| Criterion (intent.md) | Result | Evidence |
|---|---|---|
| SC1 Leave-a-review button gating on /trips | NOT VERIFIED — deferred to post-migration SQL checks in Deploy (needs logged-in guest with paid past booking + reviews table). Logged-out path PASS. | E2E #3 |
| SC2 Form validation (1–5 stars, >=20 chars) | NOT VERIFIED — requires login, out of scope for this run | — |
| SC3 One review per booking | NOT VERIFIED — deferred to post-migration SQL checks in Deploy | — |
| SC4 DB rejects foreign / unpaid / future bookings | NOT VERIFIED — deferred to post-migration SQL checks in Deploy | — |
| SC5 Reviews on listing page, anchor scrolls | PARTIAL PASS: UI section + anchor scroll verified; data part (newest-first rows with name/date) NOT VERIFIED — deferred to post-migration SQL checks in Deploy | E2E #2 |
| SC6 Rating/review_count update via trigger | NOT VERIFIED — deferred to post-migration SQL checks in Deploy | — |
| SC7 build + lint pass; advisors clean | build/lint PASS; advisors NOT VERIFIED (deferred to Deploy) | Static checks |

## Console / network errors
- /listings/:id: 2x `404` on `GET /rest/v1/reviews?...` — expected, the `reviews` table is not yet migrated. UI degrades gracefully to "No reviews yet"; no crash or blank page. Should disappear after migration (re-check in Deploy).
- / and /trips: no errors.

## Failures and fixes
| Iteration | Failure | Fix commit |
|---|---|---|
| 1 | none | — |
