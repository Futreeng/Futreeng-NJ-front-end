# Pitch demo (Phase 1 content)

Static front-end demo shown to the ATU New Jersey State Council. Separate from the production Next.js/Supabase build planned in `docs/`. Everything marked SAMPLE is placeholder.

- `src/` editable sources. Hub content lives in the `CONTENT` block at the top of `<script>` in `src/src.html`.
- `deploy/` built output served at nj-council-hub.vercel.app (`/`, `/preview-823`, `/preview-825`).
- `build.py` rebuilds `deploy/` from `src/` and blocks em dashes.
- `HANDOFF.md` project state, pitch walkthrough, open decisions.
- `BACKEND_INTERFACE.md` what the pages need from the real back end, and how a live backend plugs into `council-feed.js`.

```bash
python3 pitch/build.py
cd pitch/deploy && vercel deploy --prod   # project: nj-council-hub
```

## Tests

End-to-end tests in `tests/e2e/` click through the demo: council sends, president or secretary approves, posts show on the right local sites, pull, corrections, locals sending posts up, the emergency off-switch and the backend swap point. They also check the security headers in `deploy/vercel.json` (the test server, `tests/serve.js`, sends the same headers Vercel does) and scan every page for serious accessibility problems. GitHub Actions runs them on every push. Run them from the repo root:

```bash
npm install
npx playwright install chromium
npm test
```
