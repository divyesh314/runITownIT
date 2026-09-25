'use server';

export type Place = { label: string; lat: number; lng: number };

export type RouteOption = {
  km: number;
  coordinates: [number, number][]; // GeoJSON order: [lng, lat] pairs
  routed: boolean; // true = real walking route, false = straight-line fallback
};

export type RouteResult = {
  from: Place;
  to: Place;
  routes: RouteOption[]; // usually 1, sometimes several real alternatives from OSRM
};

export type ElevationProfile = {
  gainMeters: number;
  lossMeters: number;
};

const EARTH_RADIUS_KM = 6371;

/**
 * Straight-line ("as the crow flies") distance - only used as a fallback
 * when a real route can't be found (see routeBetween below).
 */
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

type NominatimHit = { lat: string; lon: string; display_name: string };

const NOMINATIM_HEADERS = { 'User-Agent': 'RunOwn/1.0 (running app add-a-run feature)' };

/**
 * Address autocomplete for the "from"/"to" fields - called on a debounced
 * keystroke from AddressAutocomplete, so this asks Nominatim for a short
 * list of candidates rather than committing to one result. Runs
 * server-side so it can set the User-Agent header Nominatim's usage
 * policy requires (a browser fetch would silently strip it).
 */
export async function searchAddresses(query: string): Promise<Place[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '5');
  url.searchParams.set('q', trimmed);

  try {
    const res = await fetch(url, { headers: NOMINATIM_HEADERS, cache: 'no-store' });
    if (!res.ok) return [];
    const hits = (await res.json()) as NominatimHit[];
    return hits.map((h) => ({
      label: h.display_name,
      lat: parseFloat(h.lat),
      lng: parseFloat(h.lon),
    }));
  } catch {
    return [];
  }
}

type OsrmResponse = {
  code: string;
  routes?: { distance: number; geometry: { coordinates: [number, number][] } }[];
};

/**
 * Real street/path-level walking route(s) between two already-geocoded
 * points (the user picked both from the autocomplete dropdown, so no
 * geocoding happens here - just routing). Uses openstreetmap.de's free,
 * keyless public OSRM routing service (foot profile) - same "no signup"
 * spirit as Nominatim above, just a different free OSM-backed service for
 * a different job (routing needs a road/path network, not just a point
 * lookup).
 *
 * Asks OSRM for alternatives (`alternatives=true`): when the two points
 * are connected by more than one reasonable path, OSRM returns several
 * routes and the caller lets the person pick one, mirroring how a real
 * mapping app offers route choices. Most short in-city trips only have one
 * genuinely different path, so a single route is the common case - the
 * UI only needs to show a picker when `routes.length > 1`.
 *
 * Falls back to a single straight-line "route" if no path can be found at
 * all - e.g. the two points aren't connected by any mapped footpath
 * (opposite sides of an ocean), or the service is briefly unreachable - so
 * the feature always returns *something* useful rather than failing.
 */
export async function routeBetween(from: Place, to: Place): Promise<RouteResult> {
  const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&alternatives=true`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as OsrmResponse;
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const routes: RouteOption[] = data.routes
          .map((route) => ({
            km: route.distance / 1000,
            coordinates: route.geometry.coordinates,
            routed: true,
          }))
          // Shortest first - the sensible default selection.
          .sort((a, b) => a.km - b.km);
        return { from, to, routes };
      }
    }
  } catch {
    // Falls through to the straight-line fallback below.
  }

  return {
    from,
    to,
    routes: [
      {
        km: haversineKm(from, to),
        coordinates: [
          [from.lng, from.lat],
          [to.lng, to.lat],
        ],
        routed: false,
      },
    ],
  };
}

type ElevationHit = { latitude: number; longitude: number; elevation: number };

/**
 * Elevation gain/loss along a chosen route, via Open-Elevation - a free,
 * keyless, open-source elevation lookup service (same "no signup" bar as
 * the rest of this feature). Sampling down to at most 30 evenly-spaced
 * points along the route keeps the request small: a full route can have
 * hundreds of coordinate pairs, and Open-Elevation charges per point.
 * Returns null (not thrown) if the service can't be reached, so a slow or
 * unreachable elevation lookup never breaks the distance/route result -
 * the UI just hides the elevation stat when this comes back empty.
 */
export async function getElevationProfile(
  coordinates: [number, number][],
): Promise<ElevationProfile | null> {
  if (coordinates.length < 2) return null;

  const MAX_SAMPLES = 30;
  const step = Math.max(1, Math.floor(coordinates.length / MAX_SAMPLES));
  const sampled = coordinates.filter((_, i) => i % step === 0);

  try {
    const res = await fetch('https://api.open-elevation.com/api/v1/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        // Open-Elevation wants {latitude, longitude}; our coordinates are [lng, lat].
        locations: sampled.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      }),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { results?: ElevationHit[] };
    const results = data.results;
    if (!results || results.length < 2) return null;

    let gain = 0;
    let loss = 0;
    for (let i = 1; i < results.length; i++) {
      const delta = results[i].elevation - results[i - 1].elevation;
      if (delta > 0) gain += delta;
      else loss += -delta;
    }
    return { gainMeters: Math.round(gain), lossMeters: Math.round(loss) };
  } catch {
    return null;
  }
}
