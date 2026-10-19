# What the hub needs from the back end

The hub pages (hub and council console, officer portal, approval inbox, local site previews) talk to one object, `window.CouncilFeed`, defined in `src/council-feed.js`. Behind it sits a **backend**:

- **Demo backend** (default): this browser's storage, simulated approvals, demo clock. Used for the pitch.
- **Live backend**: a small adapter that calls the real API. Loaded with:

```html
<script>window.NJCH_CONFIG = { mode: 'live' };</script>
<script src="/live-backend.js"></script>   <!-- sets window.NJCH_LIVE_BACKEND -->
<script src="/council-feed.js"></script>
```

`window.NJCH_LIVE_BACKEND(ctx)` returns an object with every method below. In live mode the hub refuses to start if the adapter is missing or incomplete; it never falls back to demo data. `tests/e2e/backend-swap.spec.js` checks this.

## Rules for the adapter

1. **Reads are synchronous.** The adapter keeps an in-memory copy, refreshes it from the API (on load, on focus, and on push updates if available) and calls every `onChange` listener when it changes.
2. **Actions may return a Promise.** Pages `await` them and show an error message if they reject.
3. **The API decides who may do what.** The adapter passes the signed-in user's session; it never decides permissions itself.
4. **Text is shown as text.** The pages escape everything; the API should still reject over-long fields.

## Roles

| Role | Who | Can |
|------|-----|-----|
| Council admin | State council staff | Send, correct, pull posts; route what locals send up; pause; see everything |
| Local president | One per local | Approve, decline or take down council posts for their local; send up to the council; confirm contacts; manage their local's partners |
| Local secretary | One per local | Everything the president can. Backup approver: gets council posts after 48 hours without an answer. Writes posts and sends them to the council. **Only the secretary approves member sign-ups** |
| Member | Rank-and-file members of a local, approved by that local's secretary | See members-only sections and members-only council posts for their own local. No other access |
| Visitor | Anyone, not signed in | Public content only |

## What is public and what is members only

| Public (no sign-in) | Members only (approved members of a local, and the council) |
|---------------------|-------------------------------------------------------------|
| Home, about, governance, locals map | Contract hub documents (tentative agreement, ratification vote details) |
| "What's at stake" scoreboard (kept public on purpose) | Bargaining survey |
| Know your rights, safety guidance, the report button | COPE participation numbers |
| Wins the council chooses to publish | Member spotlight, "From the locals" |
| Public events, new hires, benefits and partners, text-alert sign-up | Council posts sent as **Members only** |
| Council posts sent as **Public** | |

Officer pages (portal, approval inbox) and the council console are never public. The console is its own page, `/console/`, behind the council sign-in.

**Important for the API:** the demo hides members-only sections with page code, but the content is still in the page. In production the API must not send members-only content to anyone who is not an approved member of that local (or council). Hiding it in the browser is not enough.

## Data the pages read

| Method | Returns | Notes |
|--------|---------|-------|
| `posts()` | Council posts, newest first | Each has `id, created, urgent, visibility` (`public` or `members`), `title, body, titleEs, bodyEs, startAt, endAt, origin, kind, pulledAt, edits` and `status`: one entry per targeted local |
| `status[local]` | `state` (`pending`, `live`, `approved`, `declined`, `removed`), `placement` (`feed`, `pinned`), `note`, `by` (`president`, `secretary`), `at`, `version` (the approved title and body), `correction`, `pendingSince`, `remindedAt`, `escalatedAt`, `channels` | `version` is what local sites show while a correction waits for re-approval |
| `forLocal(n)` | Posts Local `n`'s site shows right now | Approved or live, inside start/end dates, not pulled, not paused. **Members-only posts only if `canSeeMembers(n)`** |
| `subs()` | Things locals sent up | `id, created, from, by, kind` (`share`, `solidarity`, `issue`), `title, body, targets, state` (`pending`, `routed`, `declined`, `handled`), `councilNote, postId`. Issues are private to the council and the sending local |
| `log()` | Activity record, newest first | `at, actor, action, local, post or sub, title, detail` |
| `contacts(n)` | Local `n`'s directory entry | `name, num, city, accent, members, site, president, secretary, presidentSet, secretarySet, stewards, delegates, verifiedAt, requestedAt, verifyDue` |
| `partners(owner)` / `partnersAdmin(owner)` | Member-benefit partners for `'council'` or a local | Public list (active only) and officer list (all) |
| `reach(post, n)` / `reachTotal(post)` | Views, texts, taps, emails, opens | Demo numbers are simulated. Until real numbers exist, return zeros |
| `alertSubs(n)` / `emailSubs(n)` | Members signed up for texts / email | Zeros until Phase 3 |
| `paused()` | `{ all, allAt, locals: { [n]: pausedAt } }` | Off-switch state. Public |
| `isPaused(n)` | `true` if everything or Local `n` is paused | `forLocal(n)` and `partners(n)` must return nothing while this is true |
| `session()` | `{ role, local, name }` for whoever is signed in; `{ role: null }` for visitors | `role` is `council`, `president`, `secretary`, `member` or `null` |
| `canSeeMembers(n)` | `true` if the viewer may see Local `n`'s members-only content (`n` null: any local) | Approved member of that local, or council |
| `members(n)` | Local `n`'s sign-ups: `id, local, name, number, contact, state` (`pending`, `approved`, `declined`, `removed`), `created, decidedBy, decidedAt` | Officers of `n` and council only. Personal data: never on any public page |

## Actions

| Method | Who | What it does |
|--------|-----|--------------|
| `send({ title, body, titleEs, bodyEs, urgent, visibility, targets, startAt, endAt })` | Council | `visibility`: `public` (default) or `members`. Creates a post. Urgent: live at once for every target. Regular: pending for every target |
| `correct(postId, { title, body, titleEs, bodyEs })` | Council | Urgent: updates live text. Regular: approved targets go back to pending; sites keep the approved version until re-approval |
| `pull(postId)` | Council | Takes the post off every site at once |
| `routeSub(subId, { approve, note })` | Council | Decline, reply to an issue, or turn a share or solidarity request into a post (the sending local is approved automatically) |
| `requestVerify(n)` | Council | Asks Local `n` to confirm its contacts |
| `pauseAll(on, { reason })` | Council (fresh sign-in and MFA in production) | Off-switch. While on, no local site shows council posts or partners and the public hub shows only a notice. Nothing is deleted. Target: public pages empty within 10 seconds |
| `pauseLocal(n, on, { reason })` | Council (fresh sign-in and MFA in production) | Same, for Local `n`'s site only |
| `approve(postId, n, { placement, note, by, text, email })` | President or secretary of `n` | First one to act decides. `note` max 140 characters |
| `decline(postId, n, { reason, by })` | President or secretary of `n` | `reason` max 280 characters |
| `remove(postId, n, { by })` | President or secretary of `n` | Takes a live or approved post off that local's site only |
| `submit(n, { kind, title, body, targets, by })` | President or secretary of `n` | Sends a share, solidarity request or private issue to the council |
| `verifyContacts(n, { president, secretary, stewards, delegates })` | President or secretary of `n` | Updates and confirms the directory entry |
| `addPartner(owner, {...})`, `setFeatured(id, on, by)`, `removePartner(id, by)` | Council for `'council'`; that local's officers for a local | Max 3 featured per list. Adding requires the responsibility checkbox (`ack`) |
| `clickPartner(id)` | Anyone | Counts a click as a total. No visitor identity stored |
| `signIn({ role: 'council' })` / `signIn({ role: 'member', local, number })` | Anyone | Demo only. Production: council and officers sign in with email, password and an authenticator code; members with a one-time code by text or email. Returns `{ session }` or `{ error: 'unknown' \| 'pending' }` |
| `signOut()` | Signed-in user | Ends the session |
| `requestMembership(n, { name, number, contact })` | Anyone | Creates a pending sign-up for Local `n`. Returns `{ member }` or `{ error: 'missing' \| 'pending' \| 'approved' }`. Rate-limit it |
| `approveMember(id, { by })`, `declineMember(id, { by, reason })`, `removeMember(id, { by })` | **Secretary of that local only** | Returns `{ error: 'secretary-only' }` for anyone else. Removing access takes effect on the member's next request |

## Plumbing

| Method | Notes |
|--------|-------|
| `onChange(fn)` | Register a listener; return a function that removes it |
| `tick()` | Called every second by open pages. Demo: runs the reminder clock. Live: can be a no-op (the server runs reminders) |
| `reset()` | Demo only. Live: no-op or reject |

## Not covered here yet

- Real sign-in screens, invite acceptance and MFA (the demo signs in with one click; see `signIn` above). Waiting on the API's auth design.
- Events, locals list and other hub content still come from the `CONTENT` block in `src/src.html`.
