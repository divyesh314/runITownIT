# RunOwn Backend

A Rails 7 API-only backend for RunOwn: users sign up, claim map "territories"
by physically running through them (verified from a recorded GPS path), and
can challenge another player for a territory someone else already owns.

Crypto/token rewards described in the top-level project README are **not**
implemented here yet - this backend only handles accounts, territories,
runs, and challenges.

## Project Structure
- `app/controllers/` - one controller per resource (`users`, `sessions`,
  `territories`, `runs`, `challenges`), all under `/api`.
- `app/models/` - `User`, `Territory`, `Run`, `Challenge`.
- `app/services/gps_validator.rb` - turns a list of GPS points into a
  distance and a yes/no "did this path pass through that territory?".
  Territories are treated as circles (see `Territory::CLAIM_RADIUS_METERS`)
  rather than real hex-grid polygons - good enough to prove the flow works
  end-to-end without standing up PostGIS/H3.
- `db/migrate/` - creates the four tables above.
- `db/seeds.rb` - two sample users, an owned + an unclaimed territory, a
  verified run, and a pending challenge.
- `spec/` - RSpec model + request specs covering the claim/run/challenge logic.

## Setup

```bash
bundle install
cp .env.example .env        # then edit if your local Postgres needs different credentials
bin/rails db:create db:migrate db:seed
bin/rails server             # http://localhost:3000
```

Or with Docker (`docker-compose.yml` starts Postgres for you):

```bash
docker compose up --build
```

Run the test suite:

```bash
bundle exec rspec
```

> Note: this was written and reviewed in a sandbox that could not reach
> rubygems.org, so `bundle install` and the test suite have not actually been
> executed here - please run the two commands above once you pull this down
> to confirm everything installs and passes on your machine.

## Auth

There's no HTML login page - it's a token-based API:

1. `POST /api/signup` with `name`, `email`, `password` → returns the new
   user and a `token`.
2. `POST /api/login` with `email`, `password` → returns a `token`.
3. Send `Authorization: Bearer <token>` on every other request.

## API

| Method | Path | Auth? | Notes |
|---|---|---|---|
| POST | `/api/signup` | no | create an account |
| POST | `/api/login` | no | get a token |
| DELETE | `/api/logout` | yes | invalidates the current token |
| GET | `/api/users/:id` | yes | |
| PATCH | `/api/users/:id` | yes | only your own profile |
| GET | `/api/leaderboard` | no | players ranked by territories owned |
| GET | `/api/territories` | no | list every zone and its owner |
| GET | `/api/territories/:id` | no | |
| POST | `/api/territories` | yes | seed a new unclaimed zone at a lat/lng |
| POST | `/api/territories/claim` | yes | `{ lat, lng, name? }` - claims the nearest zone if it's unclaimed, 409s if someone already owns it |
| GET | `/api/runs` | yes | your run history |
| POST | `/api/runs/start` | yes | `{ territory_id?, duration }` |
| POST | `/api/runs/:id/verify` | yes | `{ gps_data: [{lat, lng}, ...] }` - verifies the path passed through the territory and, if unclaimed, hands over ownership |
| POST | `/api/challenges` | yes | `{ territory_id }` - challenge the current owner |
| POST | `/api/challenges/:id/accept` \| `/decline` | yes | owner only |
| POST | `/api/challenges/:id/complete` | yes | `{ winner_id }` - transfers the territory to the winner |

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for
any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
