# NJ Council Hub — Handoff

**Project.** Working frontend demo for the ATU New Jersey State Council.
**Client.** ATU New Jersey State Council (9 locals, ~10,000 NJ Transit bus workers).
**Built by.** Futreeng LLC.
**Audience.** Pitch to the state council.
**Status.** Phase 1 content complete. Hub rebuilt with 9 new sections. Two local-site previews built. **Deployed to Vercel production on 2026-10-17** from branch `pitch-phase1` (PR #1).

---

## Live URLs

| Thing | URL | State |
|---|---|---|
| **Hub (public demo)** | https://nj-council-hub.vercel.app | **Serves the previous build.** Needs redeploy for Phase 1 content. |
| **Hub (Claude artifact)** | https://claude.ai/artifact/PTHwCZitkkHupq9EZDBzFe | **Current.** Already updated with Phase 1 content. |
| **Local 823 preview (unified design)** | https://nj-council-hub.vercel.app/preview-823/ | Not deployed yet. |
| **Local 825 preview (unified design)** | https://nj-council-hub.vercel.app/preview-825/ | Not deployed yet. |
| Local 823 Connect (live, Haron's) | https://atu-local-823-connect.vercel.app | Live. Separate codebase. |
| Local 825 Connect (live, Haron's) | https://atu-825-connect.vercel.app | Live. Separate codebase. |
| GitHub repo | https://github.com/futreeng-hq/nj-council-hub | **Not linked to Vercel yet.** All deploys go through the Vercel MCP connector, not git push. |

---

## File inventory (sandbox, resets between sessions)

| Path | Size | Role |
|---|---|---|
| `/home/claude/site/src.html` | ~90 KB | Hub source. The one to edit. Content block at top of `<script>` holds everything. |
| `/home/claude/site/fonts.css` | ~156 KB | 8 woff2 fonts (Barlow Condensed, IBM Plex Mono, Public Sans) base64-encoded. |
| `/home/claude/site/index.html` | ~245 KB | Hub with fonts inlined (`src.html` + `fonts.css` at the `/*FONTS*/` marker). For claude.ai artifact. |
| `/home/claude/site/deploy.html` | ~90 KB | Hub with Google Fonts link instead of inlined fonts. For Vercel. |
| `/home/claude/site/preview-823.html` | ~35 KB | Local 823 preview, inlined CSS, Google Fonts link. |
| `/home/claude/site/preview-825.html` | ~35 KB | Local 825 preview, inlined CSS, Google Fonts link. |
| `/home/claude/site/_preview_shared.css` | ~18 KB | Shared design-system CSS used by both preview files (already inlined into them). |
| `/mnt/user-data/outputs/index.html` | ~245 KB | Last copy pushed to the claude.ai artifact. |

If sessions reset, re-export `src.html`, `fonts.css`, and the two `preview-*.html` files from the next build to rebuild locally.

---

## Build pipeline

```
src.html + fonts.css  →  index.html   (fonts inlined, big, for the Claude artifact)
src.html + Google Fonts link  →  deploy.html   (small, for Vercel)
preview-823.html, preview-825.html  →  deploy as-is to Vercel
```

Rebuild commands (run inside `/home/claude/site/`):

```python
s = open('src.html', encoding='utf-8').read()
assert '\u2014' not in s   # no em dashes allowed, ever
open('index.html', 'w').write(s.replace('/*FONTS*/', open('fonts.css').read(), 1))
link = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=Public+Sans:wght@400..700&display=swap" rel="stylesheet">\n<style>')
open('deploy.html', 'w').write(s.replace('<style>\n/*FONTS*/', link, 1))
```

Deploy via Vercel MCP (project `nj-council-hub`, team `wemovenewyorknet-8057`):
upload three files to `index.html`, `preview-823/index.html`, `preview-825/index.html` and create a production deployment.

---

## Pitch demo flow (what to click, in order)

1. **Open hub.** Hero: "Every message. Every stop." SMS alert-line card right below the CTAs. Point: "This is the first thing an operator sees. Phone number up front. When management shuts off the bulletin boards, this is how we reach 10,000 people in an hour."
2. **Red alert band.** "Assaulted on your route?" One-click report. Point: safety-first.
3. **"What's at stake" scoreboard.** 6 contract topics × union demand vs NJT offer vs status (color-coded). Point: "No union site shows this. Members read it, understand the fight, show up to vote."
4. **About the council.** Riley, Arroyo, 10K workers, 9 locals.
5. **Now Broadcasting.** 4 council posts, each ends in a specific **action button** (Find my vote time, Read the procedure, RSVP for Lobby Day, Start application). Point: every item ends with an ask.
6. **Know Your Rights.** 6 cards, each ends with an action (Call a steward now, File a grievance, etc.).
7. **Contract hub.** Bargaining → TA → Ratification → Ratified progress bar + 4 docs.
8. **"What the union delivered" — Wins board.** 6 wins with dollar amounts, member counts, policy wins (back pay, cameras, buses stopped, restrooms, hazard pay, $1B transit fee). Point: "Union messaging that isn't just promises. Receipts."
9. **Operator safety.** 4 steps + Report an Incident button.
10. **Events & actions.** Local 819 meetings (real) + Lobby Day (sample).
11. **"Get Involved" — Organizing ladder.** Member → Supporter → Activist → Steward → Officer. Each rung has a next step. "I want to do more" form at the bottom. Point: "Every strong local is built the same way. This surface asks people to climb."
12. **"COPE & the Trenton Fight."** Per-local participation counter (9 locals, progress bars). Call-your-senator script with S-2140 example. Point: political power is dollars-per-check + phone calls.
13. **Benefits, Spotlight, From the Locals.** All existing, now with action buttons where applicable.
14. **Council governance.** 3 columns: Executive board (Riley, Arroyo + 2 pending) / Standing committees (Bargaining, Legislative, Safety, Comms, Scholarship) / Delegates per local (2–3 each).
15. **Ride to your local.** Map + list. **Phase 2 preview callout** (yellow) with buttons:
    - **Click "Preview Local 823 →"** → opens the 823 preview page. Point: "This is what Local 823 looks like in the unified council design system. Same chrome, same components, same type stack, local red accent. The live 823 site today is a different design — Phase 2 ports it over."
    - Back, then **Preview Local 825 →** → gold accent. Same unification point.
16. **Back to hub, scroll to tail.**
    - Red SMS footer banner (same signup, phone-only).
    - **Measurement teaser.** 5 metrics (alert signups, open rate, RSVPs, COPE signups, posts reaching all 9). Private officer dashboard preview. Point: "You can't improve what you can't measure. This is Phase 2 behind the member portal."
    - **Languages note.** EN + ES today. Português, Kreyòl, 한국어, Tagalog coming in Phase 2.
    - Footer.

---

## Phase 1 — what was built this session

**New hub sections.**

1. SMS alert signup — in hero, in a red footer banner, phone-only, non-functional, labeled SAMPLE.
2. "What's at stake" contract scoreboard — 6 topics, status chips (at impasse / rejected / stalled / counter / offered), days-counter on the right.
3. "What the union delivered" wins board — 6 wins with large stat numbers.
4. "Get Involved" organizing ladder — 5 rungs + "I want to do more" form.
5. "COPE & the Trenton Fight" — per-local counters + call-your-senator with S-2140 script.
6. Council governance expanded — Executive board + Standing committees + Delegates per local.
7. Measurement teaser — 5-metric officer dashboard preview.
8. Languages note — EN/ES today + 4 "soon" chips.
9. **Action buttons on every content item** — posts, rights cards, events, benefits all end with a visible CTA.

**Visual unification across hub + 823 + 825.**

Built two preview pages (`preview-823.html`, `preview-825.html`) using the same design system as the hub: same type pair (Barlow Condensed display / IBM Plex Mono labels / Public Sans body), same navy palette, same alert band, same news card format, same SMS card, same footer, same council strip. Each preview sets its own `--local-accent` CSS variable: red for 823, gold for 825. **The live 823 and 825 sites were not touched** (they're separate Next.js codebases and would need git edits). The previews prove the design works and show the pitch audience "here's what the whole federation looks like unified."

**Navigation updates.**

Hub main nav now reads: The Fight · Wins · Contract · Get Involved · COPE · Locals. Mobile tab bar: Home · Fight · Wins · Involved · Locals.

---

## Content rules (strictly enforced)

- **No em dashes anywhere.** Use commas, periods, colons, parentheses. The build has `assert '\u2014' not in s` in it.
- **Real content, labeled real.** Only three things on the hub are real: Riley (Chairman, 819), Arroyo (VP, 822), and the Local 819 meetings (Oct 20, Nov 17, Dec 15 2026, 10am and 7pm). Everything else carries a yellow `SAMPLE` chip.
- **Officer names on previews.** 823: Elijah Spates Jr. (from the live 823 site). 825: Retheena Goodwin / Chris Haskins / Jeffrey Evans (from the live 825 site). These are public.
- **All contract demands, wins, COPE participation numbers, and measurement teaser values are plausible samples**, written to look right so the pitch audience can react to the shape without us claiming numbers we don't have.

---

## Known issues and open decisions

### City labels for the locals
The hub uses the DOL union registry city labels: 820 Union City, 822 Plainfield, 823 Elizabeth, 824 New Brunswick. Local 825's own live site shows different labels on its council strip: 820 Meadowlands, 822 Paterson, 823 Ironbound, 824 Howell. The 823 live site identifies as Newark (Ironbound + Kearny Point), not Elizabeth. **Unresolved.** The 823 preview correctly uses Newark. The hub's "Ride to your local" list still uses DOL labels. Pick one source of truth before the pitch.

### 8 vs 9 locals
The ATU state council's 990 filing says "oversight of the 8 local unions." 825's own live site also says "8 locals strong" and lists 8 (dropping 540). The hub still shows 9 (including 540 Trenton). **Unresolved.** Likely 540 Mercer is in the state but not in the state council. Confirm with Riley or Arroyo.

### GitHub to Vercel
The repo at `github.com/futreeng-hq/nj-council-hub` is not linked to the Vercel project. Every change requires an MCP-mediated redeploy. To get push-to-deploy, go to the Vercel project settings → Git → Connect `futreeng-hq/nj-council-hub` to the `main` branch.

### Spanish strings for new sections
Only the strings that existed before this session have Spanish translations in `CONTENT.strings.es`. The new strings for the scoreboard, wins, ladder, COPE, governance, measurement, and SMS copy are English-only. The language toggle still works but only translates the subset. Add ES copy before any Spanish-speaking pitch audience sees it.

### Live 823 and 825 sites
Not touched. They remain in their current (differently-designed) state. Phase 2 is porting the design-system tokens to each Next.js codebase. Can't be done from the chat — needs a developer at a terminal with repo access.

---

## For a developer picking this up (Joe or next session)

**All editable content lives in one place:** the `const CONTENT = { ... }` block at the top of `<script>` in `src.html`. Rendering functions read from it and produce HTML.

**Data shapes to know:**
- `locals[]` — each has `num, city, ll (lat/lng), garages, url, copeMembers, copeIn`. Fill `url` when real local sites are ready.
- `fight[]` — each has `topic, demand, offer, status, statusLabel`. `status` is `impasse | rejected | stalled | counter | offered` (maps to color).
- `wins[]` — each has `stat, unit, title, local, month`. Keep stat punchy (dollar amount, count, "$1B").
- `posts[]` — `date, title, tag, reach, sample, action`.
- `rights[]`, `benefits[]` — `title, body, action`.
- `events[]` — `id, dates: [[day, mon], ...], title, where, base (RSVP count), sample, action`.
- `contractSteps[]` — `label, note, state: done|current|pending`.
- `safetySteps[]`, `docs[]`, `spotlights[]`, `wall[]` — self-explanatory.

**Visual tokens** are at the top of the stylesheet under `:root{}`. The one to know: `--local-accent` defaults to `--red`. On preview-825, it's overridden to `--gold` in a per-page `<style>`. To re-skin per local, set `--local-accent` on `:root`.

**Add a new content type?** Three edits: data in `CONTENT`, a `renderX()` function below, and a call in the init block at the bottom of `<script>`.

**No em dashes.** Preserved by `assert '\u2014' not in s` in the build. If a build fails on that assertion, grep `src.html` for the character and swap for a comma, period, or colon.

**Mobile.** Tab bar is on by default under 720px wide. Section IDs the tab bar watches: `top, fight, wins, ladder, locals`. If you add a section and want it on the tab bar, update both `renderTabs()` hrefs and the `watchTabs()` map.

---

## Still-to-do before the pitch

1. ~~Deploy~~ Done 2026-10-17. Hub + preview-823/ + preview-825/ live. Mobile horizontal-scroll bug fixed in the same deploy.
2. **Confirm officer names** with Riley and Arroyo.
3. **Decide 8 vs 9 locals** and pick one set of city labels.
4. **Any real contract data** → swap into `fight[]` if available (otherwise keep SAMPLE).
5. **Any real wins** collected from locals in the past 6 months → swap into `wins[]`.
6. **Spanish translations** for new section strings.
7. **GitHub ↔ Vercel link** for push-to-deploy. Vercel project root directory is now `pitch/deploy` and git-sourced deploys work; connecting the repo in Project Settings → Git turns on auto-deploy.
8. **Content rule conflict:** `docs/CONTENT_RULES.md` allows only Riley and Arroyo by name; the 823/825 previews show those locals' officers. Decide before merging PR #1.

---

## For the pitch itself

Three sentences that work as the opening:

> "The council posts once, and the message runs the whole line — landing on all nine ATU local websites across New Jersey. Operators see one voice, one fight, one union. And every piece of content ends with a specific ask: show up, vote, call, join the alert line, climb the ladder."

Three slides that explain what we built, if asked:

- **Phase 1 — Make the hub land harder.** What's at stake, receipts, asks on every item, SMS alert line, organizing ladder, COPE with teeth, measurement.
- **Phase 2 — One movement, not nine websites.** Unified design system across all 9 local sites (823 and 825 previews show the direction). Spanish + Portuguese + Creole + Korean + Tagalog translations. Officer dashboard behind the member portal.
- **Phase 3 — Members as organizers, not audience.** "Who's my steward" lookup. Ask-the-union intake. Members-only board behind the portal. (Shift swap is deferred — it's a product in its own right with payroll and seniority rules.)

---

## Credits

Built by Futreeng LLC for the ATU New Jersey State Council. Design system informed by labor-organizing comms best practices. Content marked SAMPLE is placeholder for the pitch; real council content and member data would replace it in production.
