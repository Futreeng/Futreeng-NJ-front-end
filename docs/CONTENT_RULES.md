# Content Rules: NJ State Council Hub

**Document status:** Phase 0 | Last updated: 2026-10-15

The rules for what content can appear on the Hub and how it must be labeled.

---

## Sample vs. Real Content

### Sample Content
- **Label:** "Sample:" in title or flagged in UI with `is_sample = true` and a "Sample content" tag.
- **Examples:** all placeholder posts, all placeholder meetings (except Local 819's three dates), all officer names except Riley and Arroyo.
- **Appearance:** sample content uses the "Announcement" type `--ann-bg` background by default (yellow).
- **When:** Phase 1-5 development and demo. Removed entirely before launch (Phase 6) or clearly marked in staging/preview.
- **Git:** seed.sql contains sample data; not in production.

### Real Content
- **Definition:** approved by a Council Admin, published by the system.
- **Labeling:** no "sample" label. May say "From the local's own website" if synced.
- **Live:** appears on public pages only if `status = 'published'` and `deleted_at IS NULL` and not paused.

### Synced Content
- **Definition:** imported from a local's website or external source.
- **Label:** `arrived_via = 'Synced from local site'` or `'Email to council'` or similar.
- **Source note:** optional `source_note` field for attribution or link.

---

## Names Allowed in Content

### Allowed (confirmed as of Oct 2026)
- **Orlando Riley**, Chairman, Local 819.
- **Geraldo Arroyo**, Vice President, Local 822.

### Not Allowed (must use "Placeholder")
- All other officers or members.
- No real names for testing, seed data, or placeholder roles.
- Never invent names, bios, or quotes.

### Example
**Allowed seed content:**
```
Officer Name: Orlando Riley
Title: Chairman
Bio: [Placeholder bio text. Real bio pending approval]
```

**Not allowed:**
```
Officer Name: Jane Smith (made up)
Title: Secretary
Bio: "Jane has been with Local 540 for 15 years..." (fabricated quote)
```

---

## Quote Rules

- **Never fabricate quotes** from real people (including officers or members).
- **Never publish content as if it came from a real officer** without explicit approval.
- **Attribute all quotes** to their source.
- **If approval pending:** use "Placeholder" or mark as "Sample" until council approves.

### Example

**Not allowed (fabricated):**
```
"We're excited to build a stronger connection across all nine locals," 
says Orlando Riley, Chairman.
```

**Allowed (real, approved):**
```
At the September council meeting, Orlando Riley proposed 
the Hub as a way to share news more efficiently.
```

**Allowed (placeholder):**
```
Message from the Chairman: [Placeholder text pending approval]
```

---

## Dates and Times

- **Real dates:** from confirmed sources (Local 819 website, confirmed minutes).
- **Sample dates:** prefixed "Sample: " in title or labeled as sample.
- **Today's date (for seed data):** 2026-10-14 (today at time of demo).
- **Future dates:** sample meetings and events can be dated in the future (no restriction).
- **Past dates:** if seeding old content, label as sample.

### Example
```
// Real (no label needed)
Meeting: Local 819, Oct 20, 2026 @ 10 AM and 7 PM
source: "Synced from local site"

// Sample (labeled)
Meeting: State Council meeting (sample), Oct 28, 2026 @ 10 AM
is_sample: true
```

---

## Addresses and Contact Info

- **Do not hardcode** real council addresses in seed data.
- **Placeholder:** "Council address: To be confirmed"
- **Before launch:** confirm correct address (Trenton or Kenilworth), phone, email, office hours.
- **Post-launch:** kept current by Council Admin.

---

## Logo and Branding

- **ATU logo:** use neutral text mark only ("ATU" in a gold square) until International confirms permission.
- **ATU International branding:** do not use name or logo without explicit permission from International HQ.
- **Local branding:** respect each local's logo and name (no modification).

---

## Demo Strip and Disclaimers

### Demo Strip (Phase 0-5)
```html
<div class="demo-strip">DEMO PROTOTYPE | Sample content except where marked | Not an official ATU site</div>
```
- Removed in Phase 6 (launch) or modified to "Official NJ State Council Hub" after approval.

### Content Disclaimers (in UI and footer)
- Phase 1-2: "Prototype. Sample content. Not official ATU."
- Phase 3+: same until council approves for official status.
- Phase 6 (launch): remove or replace with "Official NJ State Council Hub" (subject to council approval).

---

## Post Type Guidelines

### Alert / Notification
- **Use for:** urgent, time-sensitive info (office changes, strike notices, weather closures).
- **Tone:** direct, brief, action-oriented.
- **Audience:** all members (or specific local).
- **Example:** "Office closed Dec 25. Back Dec 27."

### Announcement
- **Use for:** important info not urgent (pick info, schedules, location changes).
- **Tone:** clear, neutral.
- **Example:** "Winter picks posted on the office bulletin board."

### News
- **Use for:** updates, stories, achievements, legislative summaries.
- **Tone:** informative, warm, no jargon.
- **Example:** "Local 819 members donated 200 hours to community cleanup."

### Event
- **Use for:** meetings, gatherings, training, social events.
- **Tone:** inviting, clear date/time/location.
- **Example:** "Steward training, Nov 19, 9 AM, union hall."

---

## Tone and Voice

- **Audience:** working people reading between shifts on their phones.
- **No jargon:** avoid union acronyms (define on first use or skip).
- **No em dashes:** use commas, periods, colons, parentheses.
- **No corporate phrasing:** avoid "driving measurable gains," "best practices," "synergies."
- **Direct:** short sentences, active voice.
- **Warm:** members are us, not "them."

### Example

**Not allowed:**
```
The council is positioning to drive a best-in-class 
digital experience through optimization of member engagement 
across nine distinct operational units.
```

**Allowed:**
```
All nine locals can now share news in one place. 
Check the Hub for updates from your local and across the state.
```

---

## Sample Data Inventory

All seed content in `supabase/seed.sql`:

- Posts (16 sample, 1 real Local 819 sync): all marked `is_sample = true` except Local 819 synced events.
- Meetings: Local 819's three dates real (2026-10-20, 2026-11-17, 2026-12-15); all others sample.
- Officers: only Riley and Arroyo real; all others "Placeholder, [Role]".
- Locals: all nine seeded with area and website info (825 and 819 have real URLs).

---

## Before Launch Checklist

- [ ] All placeholder content removed or clearly marked.
- [ ] All officer names verified as current.
- [ ] Physical address (Trenton or Kenilworth) confirmed and live.
- [ ] Logo use with International confirmed or explicitly denied.
- [ ] Sample labels removed from all real content.
- [ ] Demo strip updated or removed.
- [ ] All seed data flushed (production starts clean or with approved real content only).
- [ ] Counsel review of all public-facing text (terms, privacy, consent wording).

---

**Next:** When an approved real post or meeting is ready, create it via the admin UI (never via seed data), and it will be recorded in activity_log with who approved and when.
