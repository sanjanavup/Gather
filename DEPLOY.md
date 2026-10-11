# Deploy Gather on Render

**The app is Node.js, not Streamlit.** Streamlit Community Cloud hosts Python Streamlit apps; to preserve Gather's existing interface and working backend, use Render.

## Deployment steps

1. Create a GitHub repository named `gather` (a private repo is fine).
2. Upload `index.html`, `server.js`, `package.json`, `render.yaml`, `.gitignore`, and the docs to the root of your repository. Do not upload a local `gather.db`.
3. Sign up or sign in at https://dashboard.render.com/ and connect your GitHub account.
4. Select **New > Blueprint**, choose your `gather` repository, and approve the configuration in `render.yaml`.
5. **Review pricing carefully before confirming.** `render.yaml` requests a paid Starter service and a 1 GB persistent disk so the SQLite outings and votes survive restarts/deployments. Render's free service loses its local SQLite data when it sleeps, restarts, or redeploys.
6. Once Render shows **Live**, open the assigned `https://...onrender.com` URL. Create an outing and use the Share link inside Gather.

To deploy without Blueprint, choose **New > Web Service**, select the repository, runtime **Node**, build `npm install`, start `npm start`, environment `NODE_VERSION=22.16.0`, `DB_PATH=/data/gather.db`, and attach a **persistent disk** mounted at `/data`. Use a plan that supports disks.

## Before sharing

- Organizer controls rely on a secret link/key stored in the organizer browser. Do not publish that secret.
- Voting is pseudonymous (a random per-browser token), rather than verified one-person-one-vote; people can use multiple browsers/devices to submit multiple votes.
- Anyone with the outing link can view the outing and suggest places.
- Data lives on Render's disk; keep backups if the project becomes important.
- This is a personal MVP; add stronger auth and abuse protections before public launch.
