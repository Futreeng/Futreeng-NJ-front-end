# Data Inventory: NJ State Council Hub

**Document status:** Phase 0 | Last updated: 2026-10-15

Every field of personal data in the system: why we collect it, lawful basis, who can read it, retention policy, and deletion method.

---

## Principles

1. **Data minimization:** collect only what we need.
2. **Member anonymity:** members are visitors by default. No member accounts, no member profiles.
3. **Transparency:** every field listed here and justified.
4. **Right to deletion:** every subscriber can delete their data in one click.
5. **Encryption:** all personal data encrypted in transit (TLS). At rest, provider default (Supabase).
6. **No sharing:** never sold, shared with third parties, or used for advertising.

---

## Personal Data by Table

### `subscribers`

**Purpose:** track email and SMS subscribers who have opted in to alerts.

| Field | Type | Collected | Lawful Basis | Who Reads | Retention | Delete Method | Notes |
|-------|------|-----------|--------|-----------|-----------|----------------|-------|
| id | UUID | auto | functional | auth'd admin only | until unsubscribe | cascade on unsub | primary key |
| email | text | subscriber form | double opt-in consent (versioned) | auth'd admin only | until unsubscribe | wipe on unsub, also hash unsubscribe token | stored lowercase, unique |
| phone_e164 | text | Phase 5 form | explicit TCPA consent | auth'd admin only | until unsubscribe | wipe on unsub (Phase 5 only) | never logged, not in exports |
| want_email | boolean | consent form | explicit consent | auth'd admin only | until unsubscribe | set false, then delete on purge | checkbox on form |
| want_sms | boolean | consent form | explicit TCPA consent | auth'd admin only | until unsubscribe | set false, then delete on purge | Phase 5 only, checkbox |
| local_ids[] | text array | subscriber choice | functional | auth'd admin only | until unsubscribe | wipe on unsub | which locals they follow |
| consent_text_version | text | form submission | consent tracking | audit only | permanent (for defense) | never deleted | version tag of wording shown |
| consent_at | timestamptz | form submission | consent log | audit only | permanent | never deleted | when consent was given |
| confirmed_at | timestamptz | double opt-in click | functional | auth'd admin only | until unsubscribe | wipe on unsub | double opt-in completed |
| unsubscribed_at | timestamptz | unsub link click | functional | audit only | permanent | never deleted | when user unsubscribed |
| token_hash | text | during create | functional (security) | internal only | until unsubscribe | wipe on unsub | hash of manage/unsub token, never raw |
| created_at | timestamptz | form submission | audit | audit only | per retention policy | wipe after retention | when subscriber created |

**Retention policy:** Unconfirmed subscribers purged after 7 days (cron job). Unsubscribed subscribers kept for 1 year (legal defense, GDPR right to be forgotten honored via soft-delete after 30 days, then hard-delete after 1 year audit hold).

**Right to deletion:** one-click unsubscribe link in every email. Unsubscribe action is idempotent (can click multiple times safely). Also available via `/api/unsubscribe?token=...` (no login required).

---

### `member_voice`

**Purpose:** allow members to submit feedback/concerns to their local secretary or council.

| Field | Type | Collected | Lawful Basis | Who Reads | Retention | Delete Method | Notes |
|-------|------|-----------|--------|-----------|-----------|----------------|-------|
| id | UUID | auto | functional | secretary for that local + council admin only | 90 days | auto-purge job (scheduled) | primary key |
| to_local_id | text | form dropdown | functional | secretary + admin | 90 days | auto-purge | which local this is for; null = council |
| message | text | form textarea | member consent (form submission) | secretary + admin only | 90 days | auto-purge | max 1500 chars. **Never sent to AI. Never in logs.** |
| reply_contact | text | optional form field | member consent | secretary + admin only | 90 days | auto-purge | email or phone for secretary to reply. Optional. |
| status | text | form/admin action | functional | secretary + admin only | 90 days | auto-purge | 'new', 'read', 'closed' |
| created_at | timestamptz | form submission | audit | secretary + admin only | 90 days | auto-purge | when submitted |
| retain_until | timestamptz | calculated | policy | internal only | until date | trigger when date passes | 90 days from created_at |

**Retention policy:** auto-purge at `retain_until` (scheduled job runs daily). No manual override. No export of member_voice data.

**Form warning (UI):** 
```
"This message will be read by the local secretary and council. 
Do not share personal details, medical or legal information, or grievance specifics here. 
Use your steward for those. Messages are kept for 90 days then deleted."
```

**RLS:** `member_voice` is completely hidden from anonymous users and from secretaries outside the target local.

---

### `profiles`

**Purpose:** track authorized users (admin and secretaries).

| Field | Type | Collected | Lawful Basis | Who Reads | Retention | Delete Method | Notes |
|-------|------|-----------|--------|-----------|-----------|----------------|-------|
| id | UUID | Supabase Auth | invite acceptance | user own row + council admin | until deactivation | on delete cascade (auth user deleted) | foreign key to auth.users |
| full_name | text | invite email + password set form | functional | user own + council admin | until deactivation | set to '[Deleted User]' on deactivation | 1-100 chars |
| role | text enum | invite creation | admin assignment | council admin only | until deactivation | cannot be changed by user | 'council_admin' or 'local_secretary' |
| local_id | text | invite creation | admin assignment | user own + council admin | until deactivation | set to null on role change | foreign key to locals |
| is_active | boolean | invite creation | admin toggle | council admin only | until deactivation | set false (soft delete) | false cuts access immediately |
| created_at | timestamptz | invite sent | audit | council admin | until deactivation | never deleted | when invited |

**Retention policy:** deactivation is a soft-delete (`is_active = false`). User loses access immediately. Full deletion (hard-delete) deferred to per-request, subject to document retention needs.

**RLS:** users can read own row. Council admin can read all. Secretaries cannot read other users.

---

### `activity_log`

**Purpose:** append-only audit trail of all actions on the system.

| Field | Type | Collected | Lawful Basis | Who Reads | Retention | Delete Method | Notes |
|-------|------|-----------|--------|-----------|-----------|----------------|-------|
| id | bigint | auto | audit | council admin only | permanent (audit trail) | **NEVER deleted** | immutable |
| at | timestamptz | trigger | audit | audit | permanent | **NEVER deleted** | when action occurred |
| actor_id | UUID | trigger (auth.uid()) | audit | audit only | permanent | **NEVER deleted** | who performed action |
| actor_role | text enum | trigger (from profile.role) | audit | audit only | permanent | **NEVER deleted** | their role at time |
| action | text | trigger | audit | audit only | permanent | **NEVER deleted** | e.g. 'post.published', 'pause.all.on' |
| target_type | text | trigger | audit | audit only | permanent | **NEVER deleted** | 'post', 'profile', 'settings', etc. |
| target_id | text | trigger | audit | audit only | permanent | **NEVER deleted** | UUID or primary key of target |
| local_id | text | trigger | audit | audit only | permanent | **NEVER deleted** | which local (if applicable) |
| details | JSONB | trigger | audit | audit only | permanent | **NEVER deleted** | structured info. **NO personal data here.** |

**Policy:** RLS denies INSERT, UPDATE, DELETE for all roles. Writes happen only via triggers and security-definer functions. `REVOKE UPDATE, DELETE, TRUNCATE` from all roles on this table.

**No personal data:** message bodies, emails, phone numbers, addresses are never logged. Only structured facts (who, what, when, why).

---

### `alerts`

**Purpose:** track alert sends (who sent, when, to whom, via which channel).

| Field | Type | Collected | Lawful Basis | Who Reads | Retention | Delete Method | Notes |
|-------|------|-----------|--------|-----------|-----------|----------------|-------|
| id | UUID | auto | functional | council admin only | permanent (audit) | soft-delete on post deletion | primary key |
| post_id | UUID | alert creation | functional | council admin | permanent | cascade delete if post deleted | what alert was sent |
| audience_local_id | text | admin choice | functional | council admin | permanent | never deleted | which local(s), null = all |
| channels[] | text array | admin choice | functional | council admin | permanent | never deleted | 'hub', 'email', 'sms' |
| status | text | admin action | functional | council admin | permanent | never deleted | 'previewed', 'confirmed', 'sending', 'sent', 'cancelled', 'failed' |
| previewed_by | UUID | admin click | audit | audit | permanent | never deleted | who previewed |
| confirmed_by | UUID | admin click | audit | audit | permanent | never deleted | who confirmed |
| recipients_count | int | send job | audit | audit | permanent | never deleted | how many received |
| created_at | timestamptz | form creation | audit | audit | permanent | never deleted | when drafted |
| confirmed_at | timestamptz | confirm click | audit | audit | permanent | never deleted | when confirmed |
| sent_at | timestamptz | send job | audit | audit | permanent | never deleted | when sent |

**RLS:** anonymous users cannot read. Secretaries cannot read. Council admin only.

**No recipient list:** we do not store "which email addresses received this alert." We only count total recipients. Individual subscriber email addresses are in `subscribers` table, not linked to `alerts`.

---

### `posts`, `meetings`, `documents`

**Purpose:** public-facing content (news, events, meetings). No personal data except author/approval audit.

| Field | Sensitive? | Collected | Retention | Notes |
|-------|-----------|-----------|-----------|-------|
| created_by | audit only | user ID | permanent (audit) | who created, never name in public |
| approved_by | audit only | user ID | permanent (audit) | who approved, never name in public |
| title, body | public | author-submitted | permanent (published) | public content. Sanitized. No personal data. |
| deleted_at | audit | trigger | permanent (soft-delete) | tombstone, not hard-deleted |

---

## Data Minimization Exceptions

These fields are NOT collected:

- Member names (members are anonymous visitors).
- Member employee IDs, badge numbers.
- Member pay information, personal health info, medical details.
- Member home addresses or personal phone numbers (only work contact if provided).
- Member grievance details, personal disputes.
- Meeting minutes with real names unless the secretary explicitly includes them and approves for public.

---

## Encryption Status

- **In transit:** TLS 1.2+ (enforced by Supabase and Vercel).
- **At rest:** Supabase default (encryption enabled, keys managed by provider).
- **Column-level encryption (future consideration):** `member_voice.message` and `subscribers.{email,phone}` could be encrypted with application key if counsel requires additional protection. Deferred to Phase 2 if needed.

---

## Data Requests and Subject Rights

### Member's Right to Access
- Members can request their subscriber data via `/subscribe/manage?token=...` (no login).
- Export available: name, email, phone, local preferences, subscription status, opt-in date.

### Member's Right to Deletion
- One-click unsubscribe link in every email. Soft-delete subscriber record.
- Request to secretary to delete any Member Voice they submitted.

### Member's Right to Correction
- Subscription preferences via `/subscribe/manage?token=...`.
- No other personal data to correct.

### Process for Requests
- Email to [council-email] with request.
- Admin review (counsel guidance on timeline).
- Response within [30 days, per GDPR-like standard].
- Document all requests and responses in `activity_log`.

---

## Legal and Compliance

### Open Questions for Counsel

- **New Jersey privacy law:** Does the NJ Privacy Act (or equivalent state privacy law) apply to the council? What are the rights, obligations, and exemptions for a non-profit or union?
- **TCPA compliance (SMS Phase 5):** What wording and consent mechanisms are required for union member text messaging?
- **Data residency:** Are there requirements for where member data must be stored (e.g., US only)?
- **Right to be forgotten:** How long must member data be retained? Can it be deleted on request, or are there legal holds?
- **Collective bargaining:** Are there union-specific obligations around member data and communications?

### Compliance Checklist

- [ ] Counsel review of privacy policy (state law applicability, rights, exemptions).
- [ ] Counsel review of terms of service.
- [ ] Counsel review of consent form wording (email and SMS).
- [ ] Counsel confirmation: TCPA requirements for SMS (if Phase 5).
- [ ] Counsel confirmation: data retention and deletion obligations per applicable state law.
- [ ] Data retention schedule applied to all retention policies.
- [ ] PII redaction in logs verified (Sentry config checked).
- [ ] Encryption status (in transit and at rest) verified.
- [ ] Do NOT assume the council is exempt from privacy law. Verify with counsel.

---

**Next:** Phase 1 begins with database migrations and RLS policy implementation. These data policies are enforced in code and SQL tests. Share these compliance questions with counsel early in Phase 1.
