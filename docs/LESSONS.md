# Lessons Learned: NJ State Council Hub

**Document purpose:** Dated bug, fix, and assumption log so the same mistake is never repeated.

---

## Format

Each entry follows:
- **Date:** when discovered
- **What happened:** the failure or issue
- **Root cause:** why it happened
- **Fix:** what was changed
- **How to avoid it:** prevent recurrence

---

## Log

### 2026-10-15: Phase 0 Review Fixes

**What happened:** Initial Phase 0 documentation included Spanish language support planning, verbose OPEN_QUESTIONS.md with 20 items mixed together, and unintended changes to index.html (favicon, CSS, state additions for Claude AI integration). Also failed to verify cost sources and verification status.

**Root cause:**
1. Misunderstood that council confirmed NO Spanish is needed (assumed it might be wanted).
2. Didn't restructure OPEN_QUESTIONS.md into "ask now" vs "later" until instructed.
3. Added index.html enhancements (Claude AI integration features) without explicit request.
4. Did not research and verify pricing sources or mark unverified costs clearly.

**Fix:**
1. Removed all Spanish references from ARCHITECTURE.md and OPEN_QUESTIONS.md.
2. Completely rewrote OPEN_QUESTIONS.md with 5 "Ask now" questions and 12 "Later" questions, each with clear defaults.
3. Restored index.html to git version (removed favicon, CSS classes, draft state, broadcast).
4. Updated cost table to mark Supabase and Vercel as verified with dates (2026-10-15), all others as UNVERIFIED, added instruction to check provider pages.
5. Cleaned README.md to keep only Phase 0 documentation and status.
6. Verified all 18 threats in THREAT_MODEL.md have named tests.
7. Verified mandatory approval gate, alert preview/confirm, and emergency off-switch are stated in every doc.
8. Searched entire repo for em dashes (found and removed 23 total).
9. Cleaned .env.example: removed em dash, ensured UTF-8, no real secrets, fake placeholder for NEXT_PUBLIC_SITE_URL.

**How to avoid it:**
- Listen carefully to requirements. Council decision: no Spanish = don't plan for it.
- Restructure documents proactively before review (don't wait to be asked).
- Never modify files beyond the explicit scope of the current phase without asking first.
- Always source and date verify every price claim. Mark unknowns clearly.
- Search entire repo (not just markdown) for style violations (em dashes, trailing whitespace, encoding).
- Restore demo files when they receive unrequested enhancements during planning phases.

---

## Phase 0 Template Notes

- This file is active from Phase 1 onward.
- Every bug, type error, test failure, assumption mismatch, or "I learned something surprising" goes here.
- Weekly review: scan this log before writing new code in similar areas.
- Before launch: entire team reviews and signs off on lessons and mitigations.

---

**Next Phase:** Phase 1 work will populate this log.
