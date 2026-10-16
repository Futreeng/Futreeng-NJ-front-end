# Open Questions: NJ State Council Hub

**Document status:** Phase 0 | Last updated: 2026-10-15
**Contact person:** Haron (relays to Orlando Riley)

---

## Ask Now (5 Questions)

**Forward to Haron. These unblock Phase 1-2 work.**

### 1. Which locals have their own websites? Can we pull from them?

**Question:** For each of the nine locals, which have their own websites? Would they allow us to pull their news into the hub?

- Confirmed: Local 819 (atulocal819.org), Local 825 (atu825.com).
- Unknown: 540, 820, 821, 822, 823, 824, 880.

**Why:** Phase 4 source checks will sync events from local websites. Need permission and technical details.

**Default (Phase 1):** Display all as "Own site: to be confirmed" except 819 and 825. Phase 1-2 proceed without this; Phase 4 uses confirmed list.

---

### 2. Who posts at each local, and who approves at the council?

**Question:** Who posts updates at each local (one secretary per local, or shared)? Who at the council approves them (Orlando, or a team)?

**Why:** Role assignment, invite list, training. Rough headcount is fine; exact names can come later.

**Default (Phase 1):** Assume one secretary per local, Orlando or designate as primary council admin. Collect exact names before Phase 2 goes live.

---

### 3. Roughly how many members total?

**Question:** Across all nine locals, how many members are there?

**Why:** Capacity planning for database, email volume, SMS costs.

**Default (Phase 1):** Assume 5,000-10,000 members. Adjust tiers if actual count is higher.

---

### 4. Email only, or text message alerts too?

**Question:** Do they want text message alerts (Twilio), or email alerts only to start?

**Why:** SMS requires carrier registration (2-4 weeks approval), higher cost per send, TCPA compliance. Email is Phase 3; SMS is Phase 5. Can defer SMS if not urgent.

**Default (Phase 1):** Email alerts only (Phase 3). SMS deferred to Phase 5 (behind feature flag, off by default). Decide now if SMS is wanted at all.

---

### 5. Member Voice (member message form) at launch?

**Question:** Do they want Member Voice enabled at launch (Phase 2 onward)? This is the form where members send feedback to their local secretary.

**Why:** Member Voice is sensitive (90-day retention, access control). Can be added later if not needed now.

**Default (Phase 1):** Disabled at launch, off by default. Form can be enabled in Phase 3 if wanted.

---

## Later (Operational, Not Blocking Phase 1)

**These are answered before launch (Phase 6), but do not block Phase 1-2 work. Each has a stated default.**

### 6. Domain ownership and registrar

**Question:** Who owns the domain? Who has access to the registrar account? What domain name is wanted?

**Default:** Futreeng purchases domain on council's behalf, transfers ownership documentation to council before launch.

---

### 7. Current officers and mailing address

**Question:** Are Orlando Riley (Chairman, Local 819) and Geraldo Arroyo (Vice President, Local 822) current? Correct council mailing address and contact info?

**Default:** Only Riley and Arroyo by name in seed content. All others as "Placeholder." Address flagged as "to be confirmed" until confirmed.

---

### 8. ATU logo permission

**Question:** Can we use the ATU logo? Who at International approves it?

**Default:** Use neutral text mark only ("ATU" in gold square). Confirm with International before launch.

---

### 9. Spend approval process

**Question:** Can Orlando approve spending on paid resources (Supabase Pro $25/mo, Vercel Pro $20/mo, email provider)? Or does it require a council vote?

**Default:** Assume Orlando can approve. Confirm decision process and budget authority.

---

### 10. Counsel review timeline

**Question:** Does the council have in-house or outside counsel? Timeline for reviewing privacy policy, terms, alert consent, TCPA (for SMS Phase 5)?

**Default:** Assume 2-4 weeks for counsel review. Draft and share early in Phase 2. Do not block Phase 1 on this.

---

### 11. Privacy law and exemptions

**Question:** What state privacy law applies (New Jersey)? Does the council have exemptions as a non-profit or union? What are member data rights (access, deletion, retention)?

**Default:** Do NOT assume exemption. Treat as general privacy compliance until counsel clarifies.

---

### 12. Existing member contact list

**Question:** Does the council have an existing member contact list (emails, phone numbers)? What consent exists for alerts?

**Default:** Do NOT import any existing list. All subscribers come via double opt-in on /subscribe form only.

---

### 13. Email-in address for submissions

**Question:** For Phase 4 source checks, want a dedicated email inbox where secretaries email posts that auto-land in the queue?

**Default:** Not in scope for Phase 1-2. Decide in Phase 4 if wanted.

---

### 14. Carrier registration for SMS

**Question:** For Phase 5 (text messaging), has A2P (application-to-person) carrier registration started? When will it be approved?

**Default:** Not yet needed. Start paperwork in Phase 4 if Phase 5 is confirmed. SMS feature flag OFF until approved.

---

### 15. Data residency and encryption

**Question:** Any compliance requirements for data location (US only, specific state)? Any union-specific compliance?

**Default:** US-based Supabase, standard TLS, provider-default encryption at rest. Counsel to clarify.

---

### 16. Restore drill and penetration testing

**Question:** Where and how should we store evidence of backup restore drills, kill-switch drills, security self-review?

**Default:** Document in docs/RUNBOOK.md and docs/DRILLS/ with timestamp, participants, results.

---

### 17. Demo strip removal and official status

**Question:** When should the demo strip (yellow bar) be removed or updated to say "Official NJ State Council Hub"?

**Default:** Remains until Phase 6 launch approval. Remove after council signs off on all content and counsel review.

---

## Phase 1 Defaults Summary

Until answers to "Ask Now" questions arrive, Phase 1-2 proceeds with these defaults:

1. Locals 819 and 825 known; others "to be confirmed."
2. Assume one secretary per local, Orlando or designate as primary admin.
3. Assume 5k-10k members (adjust tiers if higher).
4. Email alerts only (Phase 3). SMS deferred to Phase 5 if wanted.
5. Member Voice disabled at launch, can enable in Phase 3.
6. All "Later" questions answered by Phase 6 launch.

---

**Action:** Send "Ask Now" section to Haron for relay to Orlando. Collect answers before Phase 2 begins. Update this document as answers arrive.
