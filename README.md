# Gather — shared outing planner

A working full-stack version of Gather with cross-device outing links, suggestions, guest names, and optional anonymous destination voting.

## Run locally

Requires **Node.js 22+** (uses built-in `node:sqlite`, no npm install needed).

```bash
node server.js
```

Open http://localhost:3000 in your browser. Data is stored in `gather.db` alongside the server.

## Share it with friends

Deploy this folder to a Node.js host with a **persistent disk** and run `node server.js`. Set `PORT` to the host's provided port if necessary (most hosts set this automatically). Set `DB_PATH` to a location on your persistent volume (for example `/data/gather.db`). Once hosted, use **Share link** inside an outing. `localhost` links work only on your own computer and are not public.

A platform with ephemeral storage will lose its database when restarted. For production, use hosted Postgres, secure authentication, rate limits, backups, and HTTPS. Do not expose the SQLite database file publicly.

## Voting privacy and limitations

Each browser profile gets a random local token. The server only stores a SHA-256 hash of the token scoped to the outing, and tallies are hidden until an organizer reveals them. The server still sees the submitted token during requests; this is **not cryptographic anonymity** or verified one-person-one-vote. A friend using different browsers or clearing local storage may cast multiple votes. Treat this as a casual friend-group poll.

Anyone with the outing link can suggest places and add a guest name. The organizer's admin key stays in that browser's local storage; don't clear browser data until you're finished organizing. There is no login or account recovery in this MVP.

## Publish online

See [DEPLOY.md](DEPLOY.md) for the Render guide. The included `render.yaml` configures a **paid** persistent disk; review charges before deploying.
