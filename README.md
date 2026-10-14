# NJ State Council Hub (Demo)

Front-end prototype for a pitch to the ATU New Jersey State Council. It gathers news, events, notifications, and announcements from the nine NJ locals into one place, while each local keeps its own way of working. Member onboarding is unchanged.

Status: demo only. All posts are sample content except Local 819's three meeting dates, which come from its public website. Not an official ATU site.

## Run it

It is one self-contained file. Open `index.html` in a browser, or serve the folder:

    python3 -m http.server 8000

## Where to edit

- Colors and spacing: CSS variables at the top of `index.html`
- Locals and post types: `LOCALS` and `TYPES` near the top of the script
- Sample posts: the `posts` array
- State resets on reload by design (no database yet)

## Mandatory gate

Human approval before anything publishes, and an emergency off switch (pause all, pause one local, unpublish one post), are required in every version of this build. Do not remove them.

## Next steps once approved

Database, logins and roles (local secretary, council admin), real approval workflow, notification delivery, and syncing from each local's existing site.

## Open items

- Confirm current council officers and mailing address
- Confirm which locals have their own websites
- Replace sample content with real content only after council approval
