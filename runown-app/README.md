# RunOwn (mobile)

The React Native / Expo app: sign up, see the territory list, run to claim
one, and challenge other owners. Talks to `runown-backend` over plain HTTP -
no crypto wallet screens are built here (see the top-level README for why).

## Screens

- `app/(auth)/login.tsx`, `signup.tsx` - email/password auth against the
  Rails API, token stored on-device with AsyncStorage.
- `app/(tabs)/index.tsx` - **Map** tab. Lists every territory and its owner,
  lets you challenge an owned one, and has a "claim the zone I'm standing
  in" button that reads your current GPS position.
- `app/(tabs)/run.tsx` - **Run** tab. Start/stop a run; while running it
  records your GPS position every ~5s (`services/gps.ts`), then sends the
  whole path to the backend to verify and (if you passed through an
  unclaimed zone) claim it.
- `app/(tabs)/leaderboard.tsx` - players ranked by territories owned.
- `app/(tabs)/profile.tsx` - your stats, plus any pending challenges against
  turf you own (accept/decline).

`services/api.ts` is the one place that talks to the backend; `services/gps.ts`
wraps `expo-location`; `services/geo.ts` has the same haversine-distance math
used server-side, for the live distance/time readout during a run.

> There's no visual map-with-pins view yet (that needs a maps SDK + API key)
> - territories are shown as a plain list for now.

## Setup

```bash
npm install
```

Point the app at your backend by editing `extra.apiUrl` in `app.json`
(defaults to `http://localhost:3000/api`, which works for the iOS
simulator; for a physical device or Android emulator use your computer's
LAN IP or `10.0.2.2` instead of `localhost`).

```bash
npx expo start
```

Then open it in a [development build](https://docs.expo.dev/develop/development-builds/introduction/),
an Android emulator, an iOS simulator, or [Expo Go](https://expo.dev/go).

Useful checks while developing:

```bash
npx tsc --noEmit   # typecheck
npx expo lint      # lint
npx expo export --platform web   # bundles the whole app - good smoke test
```
