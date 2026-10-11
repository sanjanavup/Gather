# Gather v3 — shared outing planner

Includes shareable outing links, place suggestions, optional anonymous voting, three-way RSVP (Going / Maybe / Can't make it), organizer-only editing, automatic `$` formatting for numeric budgets, and mobile layout improvements.

## Update existing GitHub + Render deployment

Upload **the contents of this folder** to the root of your existing `Gather` GitHub repository, replacing `index.html`, `server.js`, `package.json`, `README.md`, `render.yaml`, and `.gitignore`. Do not create a new Render service or Blueprint. The existing Render Web Service should automatically deploy the commit. Its build command should be `npm install` and start command `npm start`; Node >=22.13.

## Persistent storage — important

By default Gather stores data in a local SQLite file, which is **temporary on Render Free**. To persist plans and voting across Render restarts, create a Turso/libSQL hosted database and an auth token, then set the following two environment variables on **Render > Gather > Environment**:

- `TURSO_DATABASE_URL` — the database URL, beginning `libsql://`.
- `TURSO_AUTH_TOKEN` — a database access token. Treat it as a secret: only put it in Render's Environment settings, never GitHub or screenshots.

After saving variables, deploy/restart the Render service. New outings will be stored in the hosted database. **Existing outings in Render's local database do not automatically migrate**. Retain old outing links for reference but recreate the existing sample outing on the new database unless you've exported/migrated it. The API will log `Gather database connected (hosted)` when successful.

Before production use, add accounts or invite-specific access controls and abuse protection: anyone with an outing link may add an RSVP/suggestion and browser-token voting only discourages (does not prevent) repeated voting.

## Local use

Install Node 22+, run `npm install` followed by `npm start`, and open `http://localhost:3000`. Without Turso variables it stores local data in `gather.db`.
