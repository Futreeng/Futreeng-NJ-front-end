# Architecture: NJ State Council Hub

**Document status:** Phase 0 planning | Last updated: 2026-10-15

## 1. System Overview

The NJ State Council Hub is a centralized platform for the ATU New Jersey State Council (nine locals) to publish news, events, announcements, and alerts. Members are anonymous visitors; no member accounts are created. Content flows through an approval gate before publication. A kill-switch can pause all public content instantly.

### Trust Boundaries

```
[Public (anonymous)]  <- RLS enforced      <- [Database: Postgres + RLS]
      |                                              |
  Public pages                                  Settings, Posts, Meetings
  (Home, Calendar, etc.)                        (Approved content only)
      ^
      |
  [Server Middleware]
  (auth checks, RLS enforcement, cache control)
      ^
      |
[Browser - Admin]  <- Session auth (MFA)  <- [Server: Next.js API Routes]
  (Council Admin,                              (Invite acceptance,
   Local Secretary)                            approvals, alerts,
                                               service-role operations)
      ^
      |
[Storage (Private)]  <- Signed URLs         [External Services]
  (Flyers, PDFs)        (server-checked)     (Email, SMS, AI)
```

## 2. High-Level Data Flow

### Public Content Visibility

1. **Secretary submits a post** → lands in `draft` status on client, sent to server.
2. **Server route validates** with Zod, creates post as `pending` (secretary cannot bypass this).
3. **Council Admin reviews** posts in `/admin` approval queue.
4. **Admin approves** → post transitions to `published`, cache invalidated, `published_at` set server-side.
5. **Anonymous users fetch** public pages, **RLS blocks** anything not `published` and not deleted.
6. **If global pause** → `settings.global_pause = true` → RLS returns zero rows → cache revalidates → public pages empty within 10s.

### Alert Flow

1. **Admin drafts alert** → sees preview (modal with text bubble and email rendering, exact recipient count).
2. **Admin confirms send** → alert status changes to `confirmed`.
3. **Server job checks** pause flags and alerts before each send (not just at confirm time).
4. **Recipients receive** email/SMS/hub notification, alert marked `sent` with timestamp.
5. **If admin cancels** mid-send → remaining batches skip (visible stop button).

### File Upload

1. **Secretary/admin uploads** PDF/image to a post or meeting (via `/api/upload`).
2. **Server validates** magic bytes, EXIF stripping, malware scan decision.
3. **File stored** in private Supabase Storage bucket, metadata recorded in `documents` table.
4. **Public access** only via signed URL generated server-side after RLS check passes.

### Member Voice

1. **Member fills form** (no login), chooses target local, writes message.
2. **Submitted to `member_voice` table** with `retain_until` (90 days).
3. **Secretary/Admin reads** via `/admin`, routed by local.
4. **Auto-purge** after 90 days (scheduled job).

## 3. Database Schema Layers

### Schema Separation

- **Public-readable (via RLS):** `posts` (published only), `meetings` (published only), `locals` (always).
- **Admin-readable:** everything above, plus drafts, pending, activity log, subscribers, etc.
- **Append-only (RLS denies direct INSERT):** `activity_log` (only via triggers/functions).
- **Personal data:** `member_voice` (90-day retention), `subscribers` (minimal).

### Key Constraints

- Enum `app_role`: `council_admin`, `local_secretary`.
- Enum `publish_status`: `draft`, `pending`, `published`, `unpublished`, `rejected`.
- Secretary can only edit posts for their own local, cannot publish.
- Council Admin can approve/publish/unpublish anything.
- Status transitions strictly enforced by triggers (no invalid transitions).

## 4. Authentication and Authorization

### Invite Flow

1. **Admin goes to `/admin` → People → Invite** → enters email and selects local (or leaves blank for admin).
2. **Server sends email** with a single-use, 72-hour token.
3. **Recipient clicks link** → `/auth/accept-invite?token=...`
4. **Sets password** (12+ chars), optionally enrolls in MFA (required for council admin).
5. **Account created** with `profile.role` and `profile.local_id`.

### Session Security

- HTTP-only, Secure, SameSite=Lax cookies.
- Idle timeout: 30 min (admin), 12 hours (secretary).
- Re-auth required for: pause toggle, role changes, content deletion, data export.
- Rate-limit login attempts (progressive backoff).
- Deactivation (`profile.is_active = false`) cuts access immediately (RLS checks it).

### Authorization at Every Boundary

- **Server actions** check `auth.uid()`, role, and scope server-side.
- **Route handlers** re-verify before returning data.
- **RSC data fetches** call `requireCouncil()` or `requireSecretaryFor(localId)` guards.
- **Middleware alone is not trusted** (additional verification at the function level).

## 5. Caching and Cache Invalidation

### Public Pages (Home, Calendar, Locals, Council)

- **Server-rendered** (SSR or static with ISR).
- **TTL:** 30 seconds max (short to support kill-switch drill).
- **Revalidation tags:** `posts-published`, `meetings-published`, `settings`.
- **On pause:** admin action triggers `revalidateTag('settings')` → all public pages re-render, see pause.
- **Verification test:** pause, check public site empty within 10s, unpause, content returns.

### Private Pages (Admin approval queue)

- **No caching** or very short TTL.
- **Revalidate on:** post status change, approval action.

## 6. File Storage

### Bucket Structure

- **Private bucket** (`/supabase/storage/rules.json` restricts to authenticated users with proof of RLS pass).
- **Path:** `/documents/{post_id}/{uuid}_{originalName}` or `/documents/{meeting_id}/{uuid}_{originalName}`.
- **Access:** signed URL generated server-side after `requireCouncil()` or `requireSecretaryFor()` check.
- **Retention:** cascade delete when post/meeting is deleted (`on delete cascade`).

### Validation

- **Magic bytes check** (not extension):
  - PDF: `%PDF`
  - JPEG: `FF D8 FF`
  - PNG: `89 50 4E 47`
  - WebP: `RIFF ... WEBP`
- **Max 10 MB.**
- **EXIF strip** (images).
- **SHA-256 compute and store** (for audit).

## 7. External Integrations

### Email (Phase 3)

- **Provider:** Resend or Postmark (transactional).
- **Sending domain:** `nj-council-hub.org` (or TBD) with SPF, DKIM, DMARC verified.
- **Templates:** standard (no embedded images, plain-text fallback).
- **Rate limits:** per-day caps to avoid budget overruns.
- **Bounce/complaint handling:** auto-suppress after hard bounce or complaint.

### Text Messages (Phase 5, feature flag OFF)

- **Provider:** Twilio.
- **Constraint:** carrier registration required before ANY send.
- **Consent:** versioned, timestamped opt-in form with exact wording shown.
- **Keywords:** support STOP, UNSUBSCRIBE, HELP automatically.
- **Cost tracking:** per-message, daily caps.

### AI (Phase 4, feature flag OFF)

- **Provider:** Anthropic API (Claude).
- **Use:** secretary pastes notes or uploads flyer → server calls API → returns structured JSON.
- **Constraints:** server-side only, API key never exposed, output validated with Zod before filling form.
- **Rate limits:** per-user, per-day, input size limits.
- **Prompt injection defense:** treat input as data, never as instructions, constrain to JSON schema.
- **Security:** no member data sent, no Member Voice content sent to AI.

### Source Checks (Phase 4, feature flag OFF)

- **Method 1:** Pull Local 819 and 825 websites (respect `robots.txt`, polite rate limits).
- **Method 2:** Email-in address that routes submissions to queue.
- **Method 3:** Manual entry by secretary.
- **SSRF protection:** allowlist only configured HTTPS domains, block private IPs, limit redirects and timeouts.
- **Parsing:** sanitize HTML defensively, extract text only, no script execution.
- **Landing:** all imports land as `pending` posts with `arrived_via` set (never public).

## 8. Rate Limiting

**Provider:** Upstash Redis or Postgres-based counters.

**Limits per boundary:**

- Login: 5 attempts per 15 minutes per IP.
- Password reset: 3 per hour per account.
- Invite sending: 10 per day per admin.
- Post submission: 10 per hour per secretary.
- Alert send: 5 per day per council.
- Subscribe/unsubscribe: 20 per hour per IP.
- Upload: 5 per hour per user.
- AI request: 10 per day per user, 100 per day per system.

## 9. Monitoring and Observability

### Logging

- **Structured logs** (JSON) with request IDs.
- **PII redaction:** hash/truncate emails, never log passwords/tokens/phone numbers/message bodies.
- **Sentry integration:** error tracking with PII scrubbing configured.
- **Activity log:** append-only audit trail in database (what, who, when, why).

### Metrics

- **Uptime monitoring:** external service (e.g., Uptime Robot) checks `/api/health` every 5 minutes.
- **Error rate:** track 5xx errors, 4xx post submission errors.
- **Send volume:** email and SMS send counts, costs.
- **Performance:** LCP, CLS, INP from Lighthouse CI on key pages.

## 10. Environments

### Local Development

- Supabase CLI local stack.
- `.env.local` with development keys (never committed).
- Seed data: `supabase/seed.sql` (sample only, no real member data).

### Preview (per-PR)

- Separate Supabase branch or PR-specific environment.
- Fake data only.
- Vercel preview deployments.

### Staging

- Separate Supabase project and Vercel project.
- Separate API keys, no production data.
- Behind authentication.

### Production

- Production Supabase project, production Vercel project.
- Real member data (minimal).
- Backups with point-in-time recovery, restore drilled.

## 11. Deployment Checklist (before Phase 1 → 2 → ... → 6)

- [ ] Database migrations run in CI against scratch DB.
- [ ] All secrets in Vercel/Supabase environment stores, never in `.env` files in git.
- [ ] RLS policies tested (14.1 test suite).
- [ ] Kill-switch drill completed and timed.
- [ ] Restore drill completed and documented.
- [ ] Custom domain configured with HTTPS, HSTS, DNS MX for email.
- [ ] Content approval by the council (officers, addresses, etc.).
- [ ] Counsel review of privacy policy, terms, alert consent.
- [ ] Demo strip removed for production release.
- [ ] Onboarding docs for secretaries and admins.

## 12. Known Unknowns (see `OPEN_QUESTIONS.md`)

1. Who owns the domain and registrar account?
2. Which local websites allow pulls or embeds?
3. Correct council physical address (Trenton or Kenilworth)?
4. Are the officers listed current?
5. Can we use the ATU logo?
6. Who is the day-to-day Council Admin and backup?
7. Which secretaries are assigned to which locals?
8. Total member count (for capacity planning)?
9. Counsel review timeline?

---

**Next:** Draft THREAT_MODEL.md and OPEN_QUESTIONS.md. Then create task lists for Phase 0 and Phase 1.
