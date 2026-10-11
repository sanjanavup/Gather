# Gather — make plans together

**Gather** is a live group outing planner for friends who want to make plans without juggling endless messages. Create an outing, share its link, collect suggestions, RSVP and — when the group can't choose — run an optional anonymous destination vote.

**[Try the live app](https://gather-ueck.onrender.com)**

## Features

- **Outing details:** Set a title, date, time, area, per-person budget and description; organizers can edit these later.
- **Shareable links:** Everyone can open the same plan from a phone or computer, with no account required.
- **Group suggestions:** Add places or activities for everyone to consider.
- **RSVP tracking:** Friends can respond Going, Maybe or Can't make it.
- **Optional voting:** Participants can vote on suggested places, change their choice while voting is open, and see the results when the organizer reveals them.
- **Persistent storage:** A hosted Turso database keeps new event details, suggestions, RSVPs and votes across Render restarts.
- **Responsive UI:** A mobile-friendly interface with basic accessibility improvements.

## Built with

| Layer | Technology |
| --- | --- |
| Frontend | HTML, CSS and vanilla JavaScript |
| Backend | Node.js HTTP server |
| Database | Turso (libSQL / SQLite) |
| Deployment | GitHub + Render |

## How it works

1. Create an outing with the date, area and budget.
2. Share its unique link with friends.
3. Friends suggest destinations and add their RSVP.
4. If needed, open a destination vote and reveal the group result.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm start
```

Visit `http://localhost:3000`.

For hosted storage, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in your environment. Without these, the app uses local storage on the server, which **is not persistent on Render Free**. Keep credentials out of commits and screenshots.

## Deployment

The project is deployed as a Render Web Service with `npm install` as the build command and `npm start` as the start command. To publish an update, push changes to `main` on GitHub; automatic deploys should pick them up.

## Design limitations / future work

Gather is an early personal project rather than a hardened production service. Vote choices are hidden from other participants, but voting isn't cryptographically anonymous. Each browser receives a private token, so a person using multiple browsers may cast more than one vote. Anyone with an event link can view it and make suggestions/RSVPs; invite controls, stronger organizer authentication, abuse prevention and guest identity management are future improvements.

## Project links

- **Live app:** https://gather-ueck.onrender.com
- **Source code:** https://github.com/sanjanavup/Gather
