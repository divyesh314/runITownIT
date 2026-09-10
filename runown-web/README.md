# RunOwn (web dashboard)

A read-only Next.js dashboard that mirrors the RunOwn app in the browser:
landing page, the full territory list with owners, and the leaderboard.
Server components fetch straight from `runown-backend`'s public GET
endpoints - no login here (that's the mobile app's job for now), and no
crypto/wallet pages (see the top-level README for why).

## Pages

- `app/page.tsx` - landing page with live stats (territories claimed,
  players) pulled from the API.
- `app/territories/page.tsx` - table of every territory and its owner.
- `app/leaderboard/page.tsx` - players ranked by territories owned.
- `lib/api.ts` - the only place that talks to the backend; every call fails
  soft (empty list + an "API not reachable" message in the UI) instead of
  crashing the page if the backend isn't running.

## Setup

```bash
npm install
cp .env.local.example .env.local   # then edit API_URL if your backend isn't on localhost:3000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without the backend
running you'll still see the page - just with empty tables and a note that
the API couldn't be reached.

```bash
npm run lint
npm run build
```
