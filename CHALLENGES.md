# Challenges — security review, production hardening, and what it took to get here

This is a companion to the main `README.md`. That one describes what RunOwn
does; this one is the honest account of what was wrong, what got fixed, what
didn't, and what actually made this project hard to stand up — the kind of
detail worth having on hand if someone asks "walk me through a real bug you
found and fixed."

## 1. Security vulnerabilities found in the backend, and how each was fixed

### 1.1 Critical — territory claiming had no real GPS verification (spoofable)

**Where:** `POST /api/territories/claim` (`app/controllers/territories_controller.rb`)

**The bug:** The whole premise of RunOwn is "you have to physically run
through a zone to own it" (see the GPS-verification design note in the repo).
That's genuinely enforced in one place — `POST /api/runs/:id/verify`, which
checks a full recorded GPS path against the territory via `GpsValidator`.
But a second endpoint, `/api/territories/claim`, let a client claim a
territory by sending a single `{ lat, lng }` pair with **no path, no run, no
verification at all** — the server just trusted whatever coordinates showed
up and handed over ownership. The mobile app's "📍 Claim the zone I'm
standing in" button on the home screen calls exactly this endpoint. In
practice: a modified request, a location-mocking app, or just curling the
endpoint with any coordinates you like could claim any territory on the map
instantly, from anywhere, with no run required — the core mechanic didn't
actually hold.

**The fix:** Added a server-side plausibility check. Every claim is now
compared against that same user's most recently claimed territory: if the
distance between the two claims, divided by the time elapsed, works out to a
speed no runner could hit (> 8 m/s — a generous sprint pace), or if two
claims land within 15 seconds of each other, the claim is rejected with a
clear error telling them to start a tracked run instead. This doesn't
require a database migration — it's computed from data already on hand.

**What this doesn't solve, on purpose:** a single point is still a single
point. A brand-new account's *first* claim, or a slow, patient spoofer who
respects the speed limit, isn't caught by this. The real fix is requiring a
short GPS trace (a few points over a few seconds) for every claim, the same
way `runs#verify` already works — that's a legitimate follow-up, not a quick
patch, and is listed under "known limitations" below rather than glossed
over.

### 1.2 High — any authenticated user could resolve someone else's challenge

**Where:** `POST /api/challenges/:id/complete` and `GET /api/challenges/:id`
(`app/controllers/challenges_controller.rb`)

**The bug:** `accept`/`decline` correctly check that only the territory's
current owner can call them. `complete` had no such check at all — any
logged-in user, whether or not they were the challenger or the territory
owner, could call `complete` on *any* challenge ID and pick either
participant as the winner, forcibly transferring someone else's territory.
`show` had the same gap in a smaller way: any user could look up any other
user's challenge by ID.

**The fix:** Added a `require_participant!` check (challenger or the
territory's current owner, matching the same scoping `index` already uses)
in front of both `show` and `complete`.

### 1.3 Medium — any logged-in user could look up any other user's email

**Where:** `GET /api/users/:id` (`app/controllers/users_controller.rb`)

**The bug:** The endpoint returned the full user record (name, email,
timestamps — password/token were already stripped by `User#as_json`) for
*any* user ID, to *any* authenticated caller. Nothing in the app's UI
actually needed a stranger's email, so this was pure unnecessary exposure.

**The fix:** Your own profile still returns in full. Anyone else's is
trimmed to `{ id, name, territories_count }` — the same information already
visible on the leaderboard and on territories they own.

### 1.4 Medium — no protection against brute-forcing logins

**The bug:** `POST /api/login` had no rate limiting of any kind. A script
could try passwords against an account (or against many accounts) as fast as
the network would allow.

**The fix:** Added `rack-attack` with three throttles: 8 login attempts per
IP per 20 seconds, 5 login attempts per email per minute, and 5 signups per
IP per minute. Fails open (a cache hiccup lets requests through rather than
taking the API down) and returns a plain `429` with a `Retry-After` header.

### 1.5 Medium — no `secret_key_base` configured for production at all

**The bug:** This repo never ran `rails credentials:edit` (no
`config/credentials.yml.enc`, no `master.key` — correctly never committed,
per `.gitignore`), and production config never read `SECRET_KEY_BASE` from
the environment either. Rails needs a `secret_key_base` to sign cookies and
tokens; with neither source configured, the app would raise
`ArgumentError: Missing secret_key_base` on its very first boot in
production; deploying would fail with a message that gives no hint the true
cause is a missing env var.

**The fix:** `config/environments/production.rb` now reads
`ENV.fetch('SECRET_KEY_BASE')` directly — no encrypted-credentials file
needed. `render.yaml` has Render auto-generate this value on first deploy so
there's nothing to copy in by hand; `.env.example` documents how to generate
one locally (`ruby -rsecurerandom -e "puts SecureRandom.hex(64)"` — needs no
gems, works even in this sandbox).

### 1.6 Low — no Host header allowlist

**The bug:** `config/environments/production.rb` never set `config.hosts`,
so Rails' Host-header allowlisting (protection against Host header
injection / cache poisoning) was effectively off in production.

**The fix:** Added `RUNOWN_ALLOWED_HOSTS` (comma-separated env var, same
pattern as the existing CORS allowlist) feeding `config.hosts`. Left
permissive if unset, so a first deploy doesn't 500 before it's configured —
set it once you know your real domain. `/health` is explicitly excluded so a
platform's load balancer can still probe it regardless of what Host header
it sends.

### 1.7 Low — the Dockerfile didn't match the app and wouldn't have built

Not a security hole by itself, but worth listing here because it would have
silently masked the fact that the container never ran the code we think it
runs: `FROM ruby:3.0` (the Gemfile pins `3.3.6` — a full major version
newer, and 3.0 is past its own security-support window), it assumed a
`Gemfile.lock` that didn't exist, and it ran
`bundle exec rake assets:precompile` on an API-only app that has no asset
pipeline gem — that command doesn't exist here and would fail the build.
Fixed: correct base image, native build deps for `pg`/`puma`, no bogus
precompile step, migrations run automatically on container start via
`rails db:prepare`.

### 1.8 High — web dashboard was on a Next.js version with a known unauthenticated RCE

**Where:** `runown-web/package.json` (`next: 16.0.0`)

**The bug:** Vercel flagged this on first deploy ("Vulnerable version of
Next.js detected"). It wasn't a false alarm: Next.js published two security
releases after 16.0.0 shipped — one in May 2026 covering middleware/proxy
bypass, SSRF, cache poisoning and XSS issues, and a more serious one in
August 2026 fixing a critical AVIF-image and Windows path-traversal flaw
that add up to unauthenticated remote code execution on affected servers.
16.0.0 predates both.

**The fix:** Bumped `next` (and `eslint-config-next`) to `16.3.3`, the
patched release in the 16.x line, and ran `npm install` for real (unlike
the backend, `registry.npmjs.org` is reachable from this sandbox, so this
one could actually be installed, built, and lint-checked here rather than
just syntax-checked). `npm audit` also turned up 9 unrelated vulnerabilities
in transitive build-tooling dependencies (eslint/typescript-eslint's
`brace-expansion`, `minimatch`, `picomatch`, plus `browserslist` and
`js-yaml`) — none of them shipped in the production bundle, but
`npm audit fix` cleared all of them with no breaking changes. `npm run
build` and `npx eslint .` both verified clean afterward.

## 2. Lower-priority items left as documented, not fixed

Being upfront about scope: these are real, but lower severity or bigger
undertakings than "make production ready" should quietly absorb into a
larger rewrite.

- **`POST /api/territories` lets any authenticated user create arbitrary
  territories.** Meant as an admin/seeding tool per its own comment, but
  there's no admin role to actually restrict it to. Low impact (it doesn't
  leak data or transfer ownership — a created territory has no owner), but
  it is a spam/griefing surface. Proper fix is a real admin role, which is
  a bigger change than this pass should make on its own.
- **Auth tokens never expire.** `has_secure_token :auth_token` gives every
  user a permanent bearer token that's only rotated on explicit
  login/logout. A leaked token is valid forever. A production version should
  track issue time and expire/rotate tokens (or move to short-lived JWTs).
- **Single-GPS-point claiming is still spoofable in the ways described in
  1.1** — the speed/cooldown check catches the obvious "teleporting"
  pattern, not a patient single spoof. Closing this properly means requiring
  a short path (not one point) for every claim, matching `runs#verify`.
- **No password reset / email verification.** There's no mailer configured
  at all (by design — see the original README), so a compromised or
  forgotten password has no self-serve recovery path today.

## 3. What "production ready" changes were made (deployment side)

- `Procfile` — `web`/`release` commands for Heroku/Railway-style platforms.
- `render.yaml` — a ready-to-use Render blueprint: web service, health
  check on `/health`, managed Postgres, and every required env var listed
  (`SECRET_KEY_BASE` auto-generated, the rest marked to fill in by hand).
- `Dockerfile` — fixed as described in 1.7, for anyone deploying via
  Fly.io/Railway's Docker path instead of Render's native Ruby runtime.
- `config/environments/production.rb` — `secret_key_base` from env,
  `config.hosts` allowlist, `/health` exempted from host checks (all new);
  `force_ssl` was already correctly wired to an env var from earlier work.
- `.env.example` — documents every env var this app now needs in one place.

## 4. What's still on you before this goes live

1. **Generate `Gemfile.lock`.** This sandbox's network policy blocks
   `rubygems.org` outright (confirmed again this session — `bundle install`
   fails with a 403 at the proxy level before it ever reaches a gem
   server), so it could not be produced here. Run `bundle install` on your
   own machine (you already have Ruby 3.3 working there) and commit the
   result — no cloud platform will build this app without it.
2. Run `bundle exec rspec` yourself for the same reason — every test in
   this project, including the new ones added for the claim-spoofing fix,
   has only ever been syntax-checked (`ruby -c`) in this sandbox, never
   executed.
3. Set `SECRET_KEY_BASE`, `RUNOWN_ALLOWED_ORIGINS`, and `RUNOWN_ALLOWED_HOSTS`
   for your real deployment (Render generates the first one for you if you
   use `render.yaml`).

## 5. The broader engineering challenges this project ran into

Worth having on hand as the "tell me about a time you had to troubleshoot
something" story, since most of it happened live:

- **This sandbox cannot reach rubygems.org at all** (egress policy, not a
  transient failure — confirmed on two separate occasions, including just
  now while writing this). Every Ruby change made here could only be
  syntax-checked (`ruby -c`), never actually run or tested against a real
  database. That's a real constraint on how much confidence to place in
  backend changes made through this tool without a follow-up local test run.
- **Getting a working dev environment onto a machine that wasn't mine to
  configure.** The whole mobile+web+backend stack ended up running on a
  friend's Windows laptop, which ruled out anything requiring WSL2/Hyper-V
  (Docker Desktop hard-requires one or the other — there's no way around
  that on Windows) and meant every install had to go through winget/MSI
  installers instead, including working around a PowerShell script
  execution-policy block and a generic MSI failure (exit code 1603) on the
  first Node install attempt.
- **A Next.js 16 Turbopack dev-server crash** (`inner_of_uppers_lost_follower`,
  an internal Turbopack bug, not an app bug — `next build` succeeded cleanly
  the whole time) that only showed up running `next dev` locally.
- **No push access to the GitHub repo from this tool**, twice now — changes
  had to be delivered as a `git bundle` file and applied locally rather than
  pushed directly.
