# NJ State Council Hub

**Production build planning (Phase 0) complete.**

Front-end prototype (index.html) was shown to the ATU New Jersey State Council. It has not been approved, and no agreement or payment exists yet. Phase 0 planning documents are below. Phase 1 development (real Next.js/Supabase build) begins when approved.

## Phase 0 Planning Documentation

- **[PHASE_0.md](docs/PHASE_0.md)**: Completion summary, task list for Phase 1.
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: System diagrams, data flow, trust boundaries, tech stack.
- **[THREAT_MODEL.md](docs/THREAT_MODEL.md)**: Security requirements, attack scenarios, verification tests (all 19 threats).
- **[OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md)**: 5 questions to ask now, 12 questions for later. Phase 0 defaults stated.
- **[CONTENT_RULES.md](docs/CONTENT_RULES.md)**: Sample labeling, allowed names (Riley, Arroyo only), tone, demo strip lifecycle.
- **[DATA_INVENTORY.md](docs/DATA_INVENTORY.md)**: Every personal data field, retention, deletion, compliance, New Jersey privacy law questions.
- **[RUNBOOK.md](docs/RUNBOOK.md)**: Deployment, rollback, kill-switch drill procedure, incident response.
- **[LESSONS.md](docs/LESSONS.md)**: Bug and lesson log (active Phase 1 onward).
- **[DECISIONS/](docs/DECISIONS/)**: Architecture decision records (ADRs).

## Mandatory Gate

Nothing publishes without council approval. Alerts require an explicit preview and confirm step. Emergency off-switch (pause all, pause one local, unpublish one post) is non-negotiable and tested before every phase launch.

## Status

- Phase 0: Complete (documentation ready).
- Phase 1 (Core): Database, auth, approval gate, public pages. Waiting for approval to start.
- Contact: Haron (relays to Orlando Riley).

## Run the Demo

The demo is in `index.html`. Open in a browser or serve:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000. State resets on reload (no database yet).

---

For production build details and Phase 1 timeline, see `docs/PHASE_0.md`.
