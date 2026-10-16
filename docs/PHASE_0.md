# Phase 0: Plan (Completed 2026-10-15)

**Objective:** Read the build prompt completely, produce planning documents, identify open questions, and establish the task list for Phase 1.

---

## Phase 0 Deliverables

### Documentation Created

- [x] **ARCHITECTURE.md**: System diagrams, data flow, trust boundaries, caching strategy, file storage, rate limiting, monitoring.
- [x] **THREAT_MODEL.md**: Risk matrix, attack scenarios, defenses per threat, verification tests, phase-wise security review.
- [x] **OPEN_QUESTIONS.md**: 20 open questions with defaults and Phase 0 assumptions. Ready to forward to Orlando.
- [x] **CONTENT_RULES.md**: Sample vs. real content, names allowed (Riley, Arroyo), quote rules, tone, demo strip lifecycle.
- [x] **DATA_INVENTORY.md**: Every personal data field, lawful basis, retention, deletion method, compliance checklist.
- [x] **RUNBOOK.md**: Deployment, rollback, kill-switch drill procedure, incident response, health checks.
- [x] **LESSONS.md**: Template for bug/lesson log (active Phase 1+).
- [x] **DECISIONS/README.md**: Template for architecture decision records (ADRs).

### Key Decisions for Phase 0

1. **Tech stack confirmed:** Next.js (App Router), React, TypeScript strict, Tailwind, Supabase, Vercel (per prompt).
2. **Data model finalized:** 11 tables (locals, settings, profiles, posts, meetings, documents, activity_log, subscribers, alerts, member_voice, source_checks) with RLS and triggers.
3. **Kill-switch mechanism:** dual-layer (settings.global_pause + RLS + cache invalidation). Drill procedure documented. Target: empty public site within 10 seconds.
4. **Approval gate:** mandatory. Secretary → pending, Council Admin → published. Status transitions enforced by trigger.
5. **Phase-wise delivery:** 6 phases (0-Plan, 1-Core, 2-Content, 3-Email, 4-AI/Sources, 5-SMS, 6-Launch). Phase 1 unblocked.

### Risk Assessment

**Green lights:**
- Build prompt is comprehensive and executable.
- Demo (`index.html`) is clear reference.
- Core security patterns (RLS, approval gate, kill-switch) well-defined.
- No blocker for Phase 1 (database + auth + public pages).

**Yellow flags:**
- 20 open questions with Orlando (operational, not technical blockers).
  - Solution: Forward OPEN_QUESTIONS.md to Orlando. Phase 1 proceeds with stated defaults.
- Counsel review needed for privacy/terms/TCPA (Phase 3-5).
  - Solution: Draft policies early in Phase 1. Share with counsel by Phase 2.

**Red flags:**
- None. All hard constraints are documented and feasible.

### Cost Estimate (Production-Grade Services)

**No spending required for Phase 0.** Production (Phase 1 onward) requires specific tiers for backups, uptime, and compliance. Free tiers are not production-ready.

| Service | Production Tier | Monthly Cost | Key Features | Verified |
|---------|-----------------|--------------|--------------|----------|
| **Supabase** | Pro | $25/mo + $100/mo PITR (optional) | 7-day daily backups included, no auto-pause, 50GB storage, $10 compute credit | Yes: supabase.com/pricing (2026-10-15) |
| **Vercel** | Pro | $20/user/mo | 50 deployments/month, auto-scaling, priority support, custom domains, commercial use allowed | Yes: vercel.com/pricing (2026-10-15) |
| **Resend** (email) | Starter or Standard | UNVERIFIED | Unlimited emails or per-volume pricing, API-driven, SPF/DKIM/DMARC | No: check resend.com/pricing |
| **Postmark** (email) | Standard | UNVERIFIED | Per-volume pricing, API, bounce/complaint handling | No: check postmarkapp.com/pricing |
| **Twilio** (SMS, Phase 5) | Pay-per-use | UNVERIFIED (see note) | Per-message cost varies by country. US carrier registration ~$500 one-time (UNVERIFIED) | No: check twilio.com/sms/pricing and carrier rates |
| **Anthropic API** (Claude, Phase 4) | Pay-per-use | UNVERIFIED | Input/output tokens, varies with usage | No: check anthropic.com/pricing |
| **Upstash Redis** | Free tier for Phase 1-2 | $0 (Phase 1) | Free tier: 10k commands/day | Yes (free tier) |
| **Sentry** | Free tier | $0 (Phase 1) | Error tracking, PII scrubbing, free tier adequate | Yes (free tier) |
| **Cloudflare Turnstile** | Free | $0 | Bot protection, free tier includes 300k requests/month | Yes (free tier) |
| **Uptime Robot** | Free tier | $0 | Monitoring every 5 min, free tier: 50 monitors | Yes (free tier) |

**Estimated Monthly Spend (Production, All Phases):**

| Phase | Service Mix | Estimated Cost | Notes |
|-------|-------------|-----------------|-------|
| **Phase 1 (Core)** | Supabase Pro, Vercel Pro, Sentry free, Upstash free | $45-120/mo | Database, hosting, monitoring. No email/SMS/AI yet. |
| **Phase 3 (Email)** | Add Resend or Postmark | +$15-20/mo | Sending ~1k-5k emails/month at launch. Scales with subscriber base. |
| **Phase 4 (AI)** | Add Claude API | +$10-50/mo | Depends on usage (10 drafts/user/day, 100/system/day caps). |
| **Phase 5 (SMS)** | Add Twilio | +$0.0075/msg | E.g., 5k members x 2 alerts/month = $75. Plus carrier reg (~$500 one-time). |
| **Total (Launch, all services)** | All above | ~$80-250/mo + $500 one-time SMS registration | Scales with usage and member base. |

**Important:**
- All tiers above include point-in-time recovery (Supabase) and no auto-pausing (Vercel).
- Free/hobby tiers are not production-ready (can be paused, limited backups, no SLA).
- Do NOT create any paid resource now. Phase 0 is planning only.
- Costs scale with volume: more members = more emails, more alerting = more SMS costs.

**Recommendation:**
- Phase 1: start on listed production tiers (backups and reliability are non-negotiable).
- Monitor spend. If over budget, defer Phase 4 (AI) and Phase 5 (SMS) to later phases.
- Upstash and Sentry have free tiers adequate for Phase 1-2; upgrade if needed.

**Approval:** Pending Orlando's confirmation from OPEN_QUESTIONS.md item 1 (spending approval).

---

## Phase 1 Task List: Core (Database, Auth, Approval, Public Pages)

**Objective:** Deliver database schema, RLS, invite-only auth with MFA for admins, approval gate, kill-switch, and public Home, Calendar, Locals pages reading real data. All tests in 14.1-14.2 pass.

### 1. Database & Migrations (3-4 days)

- [ ] Create Supabase project (dev local CLI, staging, production environments).
- [ ] Write migrations in `supabase/migrations/` for all 11 tables (section 4 of prompt).
- [ ] Implement enums: `app_role`, `post_type`, `publish_status`, `minutes_status`.
- [ ] Add indexes per prompt (posts status+date, posts local_id+status, event_date, posts search GIN).
- [ ] Implement helper functions: `is_council()`, `my_local()`, `is_paused()`.
- [ ] Write triggers: status-transition guard, audit log, updated_at.
- [ ] Test migrations in CI against scratch DB.
- [ ] Seed `supabase/seed.sql` with sample data (9 locals, officers, sample posts/meetings, no real member data).

### 2. Row Level Security (RLS) (2-3 days)

- [ ] Create RLS policies per section 4.2 for each table:
  - posts (anon SELECT, secretary SELECT/INSERT/UPDATE, council SELECT/UPDATE).
  - meetings, documents (same as posts).
  - activity_log (no API writes, council SELECT only, REVOKE UPDATE/DELETE).
  - settings, locals, profiles (per spec).
  - subscribers, alerts, member_voice, source_checks (anon access denied).
- [ ] Write SQL test suite (pgTAP or Supabase SQL tests) for each policy (14.1).
- [ ] Verify each test passes (1 test per threat in threat model).

### 3. Authentication & Authorization (3-4 days)

- [ ] Set up Supabase Auth (email/password, session management).
- [ ] Create invite-only flow: admin sends email with 72-hour token, recipient sets password, optional MFA.
- [ ] Implement MFA for council_admin roles (TOTP required).
- [ ] Configure session security: HTTP-only cookies, Secure, SameSite=Lax, 30min idle (admin), 12hr absolute.
- [ ] Implement `requireCouncil()` and `requireSecretaryFor(localId)` guards in `lib/auth/guards.ts`.
- [ ] Implement rate limits: login 5/15min per IP, password reset 3/hr per account.
- [ ] Add tests: attempt login as secretary, attempt to elevate role, attempt cross-local access (14.1).

### 4. Next.js Project Setup (1-2 days)

- [ ] Initialize Next.js (App Router, TypeScript strict mode, Tailwind CSS).
- [ ] Configure `@supabase/ssr` for SSR + browser client auth.
- [ ] Set up environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (server only).
- [ ] Add linting (ESLint), formatting (Prettier), type checking.
- [ ] Add build checks: no service-role key in client bundles (CI test).

### 5. Public Pages (Home, Calendar, Locals) (2-3 days)

- [ ] **Home** (`/`): hero with stat tiles (locals, updates visible, upcoming events), filters (search, local chips, type chips), feed of posts (newest first), sidebar with next 6 events.
- [ ] **Calendar** (`/calendar`): events grouped by month, local filter, Google Calendar link per event (generated server-side URL), downloadable .ics per event.
- [ ] **Locals** (`/locals`): nine cards (name, area, update count, next event, "See updates" link, link to local's own site if known).
- [ ] **Locals detail** (`/locals/[id]`): that local's feed, meetings, contact placeholder.
- [ ] RLS enforced: only published posts visible, no drafts/pending/rejected.
- [ ] Pause logic: if `global_pause = true`, public pages empty.
- [ ] Design tokens in CSS variables (light/dark mode per section 6.2).
- [ ] Responsive (mobile-first per section 6.1).

### 6. Admin Shell (`/admin`) (2-3 days)

- [ ] **Authentication gate:** check `auth.uid()` and role. Redirect anon to login.
- [ ] **Approval queue:** list pending posts (local, type, source, title, body, approve/reject buttons).
- [ ] **Emergency controls card (red border):** Pause ALL toggle, per-local pause chips, Member Voice toggle, Alerts toggle. Each re-auth required.
- [ ] **Published posts:** list published posts, unpublish button per post.
- [ ] **People:** invite form (email, role, local dropdown), list of active users, deactivate button.
- [ ] **Activity log:** filterable, searchable, no PII in output.
- [ ] **Member Voice inbox** (disabled by default): routed by local, mark read/closed buttons.
- [ ] Accessible headless UI (Radix or equivalent) for modals, toggles, selects.

### 7. Data Validation & Security (1-2 days)

- [ ] **Zod schemas** for every API boundary: auth, post submission, file upload, alert send.
- [ ] **Input validation:** max length checks, type checks, unknown field rejection.
- [ ] **XSS test:** render post bodies with `<script>` and other payloads (14.2), verify no execution.
- [ ] **CSRF protection:** verify SameSite cookies, test cross-site form submission.
- [ ] **Security headers:** Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Test with automated header checker.

### 8. Testing & Quality Gates (2-3 days)

- [ ] **Unit tests** (Vitest): auth guards, validators, utility functions. Target 80% coverage on `lib/`.
- [ ] **Authorization tests** (14.1.1-14.1.11): SQL or Playwright.
  - [ ] Secretary cannot publish.
  - [ ] Secretary cannot read cross-local drafts.
  - [ ] Secretary cannot modify local_id, status beyond pending, role.
  - [ ] Anonymous user cannot read pending/draft/rejected.
  - [ ] Global pause returns zero rows.
  - [ ] Per-local pause hides that local.
  - [ ] Status transitions enforced.
  - [ ] Activity log immutable.
  - [ ] Deactivated user loses access.
- [ ] **E2E tests** (Playwright, desktop + mobile viewports, light + dark):
  - [ ] Secretary submits post → pending.
  - [ ] Council approves → published, visible public.
  - [ ] Council unpublishes → disappears.
  - [ ] Pause all → public empty, resume → returns.
  - [ ] Filters and search work.
- [ ] **Axe accessibility:** zero critical or serious violations.
- [ ] **Lighthouse CI:** 90+ on performance, accessibility, best practices, SEO on public pages.
- [ ] **Type check:** `tsc --strict` clean.
- [ ] **Lint & format:** no errors, consistent code style.
- [ ] **Dependency audit:** `pnpm audit` clean, no high/critical vulns.

### 9. Kill-Switch Drill (1 day)

- [ ] **Implement pause logic:** `settings.global_pause` → RLS → anon SELECT returns zero rows.
- [ ] **Cache invalidation:** pause action triggers `revalidateTag('settings')` + purge cache tags.
- [ ] **Drill procedure:** execute drill (per docs/RUNBOOK.md), verify pause → public empty within 10s.
- [ ] **Record:** timestamp, participants, screenshots, activity_log entries.
- [ ] **Success criteria:** all green.

### 10. Documentation & Handoff (1-2 days)

- [ ] Update README.md with setup instructions (local dev, migrations, seed).
- [ ] Update ARCHITECTURE.md with actual implementation details.
- [ ] Add Phase 1 entries to LESSONS.md (if any bugs discovered).
- [ ] Create `.env.example` with required variables (no values).
- [ ] Write basic onboarding guide for secretaries (Phase 2 will expand).
- [ ] Summarize Phase 1 completion: what works, test report, demo walkthrough, next phase plan.

### 11. Prepare Phase 2 Backlog

- [ ] Design meetings table approval flow (agendas, minutes).
- [ ] Plan file upload validation (magic bytes, EXIF strip).
- [ ] Design Council page (officers, Take Action, Member Voice).
- [ ] Outline Phase 2 task list (4-5 days).

---

## Phase 1 Success Criteria

- [ ] All required tests pass (unit, auth, e2e, axe, Lighthouse, dependency audit).
- [ ] No console errors, no TypeScript errors, no lint errors.
- [ ] Kill-switch drill passes and is documented.
- [ ] Public Home, Calendar, Locals pages load and display real data.
- [ ] Admin can submit post as secretary, approve as admin, see published on public site.
- [ ] Admin can pause all, public site empties within 10s, resume restores.
- [ ] Restore drill completed (restore from backup, verify data consistent).
- [ ] No secrets in git history, no real member data in seed data.
- [ ] All docs updated (README, ARCHITECTURE, THREAT_MODEL, LESSONS, onboarding).
- [ ] Report to Orlando: what works, demo walkthrough, next phase plan.

---

## Dependencies & Risks

### Go/No-Go Criteria for Phase 2

- [ ] Phase 1 tests 100% passing.
- [ ] Kill-switch drill timed and successful.
- [ ] Orlando confirms secretaries and admins (or at least the lead admin).
- [ ] Counsel confirms timeline for privacy/terms review (not blocking Phase 2, but alert us).

### Known Unknowns

- See `docs/OPEN_QUESTIONS.md` for 20 questions to forward to Orlando.

---

**Next Step:** Forward OPEN_QUESTIONS.md and cost estimate to Orlando for review. Begin Phase 1 implementation immediately after green light on costs and admin confirmation.

**Estimated Phase 1 timeline:** 2-3 weeks (10-15 working days), depending on team size and test coverage depth.

---

**Phase 0 completed by:** Claude Haiku 4.5
**Date:** 2026-10-15
**Status:** Ready for Orlando review and Phase 1 kickoff
