# Runbook: NJ State Council Hub

**Document status:** Phase 0 template | Last updated: 2026-10-15

Operational procedures for deployment, incidents, and the kill-switch drill.

---

## Table of Contents

1. [Deployment](#deployment)
2. [Rollback](#rollback)
3. [Kill-Switch Drill](#kill-switch-drill)
4. [Incident Response](#incident-response)
5. [Health Checks](#health-checks)
6. [Contact & Escalation](#contact--escalation)

---

## Deployment

### Pre-Deployment Checklist

- [ ] All tests passing in CI (typecheck, lint, unit, RLS, e2e, axe, Lighthouse).
- [ ] Dependency audit clean (`pnpm audit` passes, security scanning clears).
- [ ] Database migrations reviewed and tested against staging.
- [ ] Rollback plan documented for this deployment.
- [ ] Feature flags reviewed (Phase-appropriate features ON, future features OFF).
- [ ] Secrets verified in production environment (Vercel, Supabase).
- [ ] PR reviewed and approved by at least one other engineer.

### Staging Deploy (from `main` branch)

```bash
# Merge PR to main (automatic or manual trigger)
# Vercel staging project auto-deploys on main push

# Verify staging is healthy
curl https://nj-council-hub-staging.vercel.app/api/health

# Check Supabase staging health
# (Visit Supabase dashboard, check DB and Auth logs for errors)

# Smoke test staging
# (Manual: visit /admin, try submit, approve, check public page)
```

### Production Deploy

```bash
# Promote from staging to production
# Method 1: Vercel dashboard → Production environment → Deploy staging build
# Method 2: Tag release on GitHub (if GitOps enabled)

# Verify production is healthy
curl https://nj-council-hub.org/api/health

# Monitor error rate for 15 minutes
# (Check Sentry dashboard for spike in errors)

# Rollback if needed (see Rollback section)
```

### Post-Deployment

- [ ] Test public site: /home, /calendar, /locals, /council load correctly.
- [ ] Test admin area: login, approve queue, unpublish a post, pause all (then unpause).
- [ ] Check error logs (Sentry) for any anomalies.
- [ ] Confirm cache invalidation worked (pause → public empty within 10s).
- [ ] Notify Orlando and team: deployment complete, no issues.

---

## Rollback

### Immediate Rollback (Vercel)

If production is broken and needs instant revert:

```bash
# Option 1: Vercel Dashboard
# 1. Go to Deployments
# 2. Find the last known-good deployment
# 3. Click "Promote to Production"
# 4. Vercel rolls back instantly (< 30s)

# Option 2: CLI
vercel rollback --prod
```

### Database Rollback

If a migration introduced a breaking bug:

```bash
# Supabase CLI: revert migration
supabase migration down --prod

# If Supabase: use dashboard to run manual SQL to undo
# (Rarely needed; migrations should be tested in staging first)
```

### Cache Invalidation After Rollback

```bash
# After rolling back code or database:
# Clear all cache tags to ensure fresh render
curl -X POST https://nj-council-hub.org/api/revalidate?secret=REVALIDATE_SECRET&tag=*

# Or, from CLI if Vercel Deploy Hooks set up:
curl https://api.vercel.com/v1/deployments \
  -H "Authorization: Bearer VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"actions": [{"type": "invalidate", "tags": ["*"]}]}'
```

### Post-Rollback

- [ ] Verify production is healthy again.
- [ ] Document root cause of the rollback.
- [ ] Fix and test the bug in staging.
- [ ] Re-deploy only after fix is verified.
- [ ] Entry in `docs/LESSONS.md`.

---

## Kill-Switch Drill

### Purpose

Test that the admin can pause ALL public content instantly. Public visitors should see an empty site within 10 seconds.

### Prerequisites

- [ ] Production deployed and healthy.
- [ ] At least two admins present (one executes, one verifies).
- [ ] Timestamp and participants recorded.

### Step-by-Step

**Admin A (Executor):**

1. Time: **T+0:00**. Record start time.
2. Go to `/admin` → Emergency Controls.
3. Click "Pause ALL" button.
4. Enter re-auth password/MFA if prompted.
5. Confirm: "Yes, pause all content now."
6. Button changes to "Resume ALL" (visible confirmation).
7. Record action in activity_log (verify via SQL: `SELECT * FROM activity_log WHERE action = 'pause.all.on' ORDER BY at DESC LIMIT 1;`).

**Admin B (Verifier):**

1. Time: **T+0:00**. Open fresh browser (or incognito) to https://nj-council-hub.org/.
2. **T+2:00**. Page should be loading or showing pause banner.
3. **T+5:00**. Page should show pause banner, zero posts.
4. **T+10:00**. Confirm: page definitely empty (refresh if needed). No stale cache.
5. Record screenshot and timestamp.

**Admin A (Resume):**

1. Time: **T+10:00**. After verification, click "Resume ALL" in Emergency Controls.
2. Confirm: "Yes, resume content now."
3. Record action in activity_log.

**Admin B (Verification 2):**

1. Time: **T+10:00**. Refresh browser.
2. **T+12:00**. Posts and events should reappear.
3. Record screenshot and timestamp.

### Success Criteria

- [ ] Pause action recorded in activity_log within 30 seconds.
- [ ] Public page empty within 10 seconds of pause.
- [ ] No cached content served after pause.
- [ ] Resume action recorded in activity_log.
- [ ] Content returns within 2 seconds of resume.
- [ ] No error messages or console errors during drill.

### Record Keeping

Save to `docs/DRILLS/kill-switch-{date}.md`:

```markdown
# Kill-Switch Drill: [Date]

**Date:** 2026-10-15
**Time:** 10:00 AM - 10:15 AM ET
**Participants:** Admin A, Admin B
**Status:** PASS / FAIL

## Timeline

- T+0:00: Pause initiated
- T+2:00: Page loading, pause banner visible
- T+5:00: Page empty, zero posts
- T+10:00: Confirmed empty, resume initiated
- T+12:00: Content returned

## Screenshots

- [screenshot-paused.png]: empty public page
- [screenshot-resumed.png]: posts visible again

## Activity Log Verification

```sql
SELECT at, actor_id, action, local_id FROM activity_log 
WHERE action IN ('pause.all.on', 'pause.all.off') 
ORDER BY at DESC LIMIT 2;
```

**Result:**
```
at                     | actor_id | action        | local_id
2026-10-15 10:00:30   | <admin>  | pause.all.on  | NULL
2026-10-15 10:10:45   | <admin>  | pause.all.off | NULL
```

## Issues Found

(None / [list and link to LESSONS.md entry])

## Next Drill

[Date and time of next scheduled drill]
```

### Scheduled Drills

- **Monthly:** first Tuesday of each month at 10:00 AM ET (documented).
- **Before Phase 2 deployment:** drill must pass within 24 hours of go-live.
- **Before launch (Phase 6):** drill witnessed by council representative.

---

## Incident Response

### Severity Levels

| Level | Definition | Response Time | Who |
|-------|-----------|---|---|
| **P1** | Public site down, members cannot see content, data loss | < 5 minutes | All admins, Futreeng lead |
| **P2** | Partial outage (e.g., admin area slow), security concern, data breach suspected | < 30 minutes | Lead admin, Futreeng |
| **P3** | Minor issue (UI bug, slow email send), non-critical feature broken | < 24 hours | Futreeng, council |

### P1: Site Down

**0-5 minutes:**
- Check `/api/health` endpoint.
- Check Vercel deployment status.
- Check Supabase status page.
- If Vercel: check recent deployments, look for failed deploy.
- If Supabase: check database logs for errors, connection issues.

**Actions:**
- Rollback app (see Rollback section).
- OR trigger manual Supabase failover if data issue.
- OR contact hosting support (Vercel, Supabase).

**Notify:**
- Orlando: "Site was down from [time] to [time]. [Root cause]. Fixed by [action]."

### P2: Security or Data Concern

**Immediate:**
- Do not panic. Do not destroy logs.
- Check Sentry for error patterns.
- Check activity_log for unexpected actions.
- Isolate affected data (pause system if needed).

**Investigation:**
- Pull logs: Vercel, Supabase, Sentry, activity_log.
- Identify scope: which tables, which users, what timeframe.
- Determine if PII exposed, breached, or at risk.
- Do not assume worst case. Gather facts first.

**Escalate:**
- If PII breach suspected: notify counsel immediately.
- If security flaw confirmed: Futreeng security review + public disclosure plan.

**Communicate:**
- Council notification (timing TBD by counsel).
- Affected members (email, clear explanation, next steps).

### P3: Minor Issues

**Triage:**
- Can it wait until next sprint? (Usually yes.)
- Is it a security issue? (No = can wait.)
- Does it block content approval? (No = can wait.)

**Action:**
- Open issue in GitHub with `type: bug` and `severity: p3`.
- Assign to next sprint.
- Log in `docs/LESSONS.md` if it reveals a pattern.

### Post-Incident

- [ ] Timeline: what happened, when, how long.
- [ ] Root cause: why did it happen.
- [ ] Fix: what was changed to resolve it.
- [ ] Prevention: what will prevent recurrence (code change, test, runbook update).
- [ ] Entry in `docs/LESSONS.md`.
- [ ] Team review (if P1 or security incident).

---

## Health Checks

### Manual Health Check

```bash
# Check app is responding
curl https://nj-council-hub.org/api/health

# Expected response:
# {"status": "ok", "db": "connected", "at": "2026-10-15T14:30:00Z"}

# Check Supabase is healthy
curl https://<project>.supabase.co/rest/v1/health -H "apikey: <anon-key>"

# Expected: 200 OK
```

### Uptime Monitoring

- **Service:** Uptime Robot (or equivalent).
- **Endpoint:** `https://nj-council-hub.org/api/health`.
- **Interval:** every 5 minutes.
- **Alert:** if 2 consecutive failures, page on-call.

### Daily Spot Checks (Admin)

- [ ] Public home page loads and shows recent posts.
- [ ] /calendar shows upcoming events.
- [ ] /locals shows all nine locals.
- [ ] /admin login works, can approve a test post.
- [ ] Send test alert, verify preview and send flow.
- [ ] No recent errors in Sentry (> 10 per hour is abnormal).

### Weekly Audits (Admin)

- [ ] activity_log has all expected actions (submits, approves, pauses).
- [ ] No data inconsistencies (e.g., orphaned documents).
- [ ] Cache strategy working (pause → empty within 10s).
- [ ] Email sends are going out (check Resend/Postmark logs).
- [ ] SMS sends are going out (if Phase 5 live, check Twilio logs).

---

## Contact & Escalation

### Contacts

**Primary Admin:** Orlando Riley (or designate)
- Email: [TBD]
- Phone: [TBD]

**Backup Admin:** [TBD]
- Email: [TBD]
- Phone: [TBD]

**Futreeng Lead:** Joe Panetta
- Email: [TBD]
- Phone: [TBD]

**Counsel (for data breach, legal issues):** [TBD]
- Email: [TBD]
- Phone: [TBD]

### Escalation

```
P1 (down):         Call lead admin → call Futreeng → notify Orlando (if not lead)
P2 (security):     Message lead admin → Futreeng → counsel (immediately if breach)
P3 (minor):        Slack or email, no urgency
```

### Out-of-Hours

- **If site is down at night:** Uptime Robot sends alert. Check status page before waking up on-call.
- **If P1 during off-hours:** on-call rotation (TBD: who and when).
- **If P2 during off-hours:** on-call security review, then counsel call.

---

## Appendix: Common Procedures

### Add a New Local Secretary

```sql
-- Step 1: Admin goes to /admin → People → Invite
-- Step 2: Enter email and select local from dropdown
-- Step 3: System sends 72-hour invite link
-- Step 4: Secretary clicks link, sets password, enrolls in MFA (for admin only)
-- Step 5: Secretary logs in and can post to their local

-- Verify in database:
SELECT id, full_name, role, local_id, is_active, created_at 
FROM profiles 
WHERE full_name = 'Jane Doe' AND local_id = '822';
```

### Deactivate a User

```bash
# Admin goes to /admin → People → find user → click "Deactivate"
# Confirm: "Yes, deactivate [name]."
# Result: profile.is_active = false, user loses access immediately

# Verify:
SELECT id, full_name, is_active, created_at FROM profiles WHERE id = '<user-uuid>';
-- Should show: is_active = false
```

### Unpublish a Post Immediately

```bash
# Admin goes to /admin → Published Posts → find post → click "Unpublish"
# Result: post.status = 'unpublished', no longer visible to public
# Cache invalidated automatically

# Verify:
SELECT id, title, status, published_at FROM posts WHERE id = '<post-uuid>';
-- Should show: status = 'unpublished'
```

### Export Activity Log (CSV)

```bash
# Admin goes to /admin → Activity Log → "Export as CSV"
# Downloads file with: timestamp, actor, action, target, local, details
# (No personal data in details field)
```

---

**Next:** Phase 1 begins. Update this runbook with phase-specific procedures and contacts.
