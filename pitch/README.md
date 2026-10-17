# Pitch demo (Phase 1 content)

Static front-end demo shown to the ATU New Jersey State Council. Separate from the production Next.js/Supabase build planned in `docs/`. Everything marked SAMPLE is placeholder.

- `src/` editable sources. Hub content lives in the `CONTENT` block at the top of `<script>` in `src/src.html`.
- `deploy/` built output served at nj-council-hub.vercel.app (`/`, `/preview-823`, `/preview-825`).
- `build.py` rebuilds `deploy/` from `src/` and blocks em dashes.
- `HANDOFF.md` project state, pitch walkthrough, open decisions.

```bash
python3 pitch/build.py
cd pitch/deploy && vercel deploy --prod   # project: nj-council-hub
```
