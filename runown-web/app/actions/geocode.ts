'use server';

export type Place = { label: string; lat: number; lng: number };

export type RouteResult = {
  from: Place;
  to: Place;
  km: number;
  coordinates: [number, number][]; // GeoJSON order: [lng, lat] pairs
  routed: boolean; // true = real walking route, false = straight-line fallback
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
 * Real street/path-level walking route between two already-geocoded
 * points (the user picked both from the autocomplete dropdown, so no
 * geocoding happens here - just routing). Uses openstreetmap.de's free,
 * keyless public OSRM routing service (foot profile) - same "no signup"
 * spirit as Nominatim above, just a different free OSM-backed service for
 * a different job (routing needs a road/path network, not just a point
 * lookup). Falls back to a straight-line distance if no route can be
 * found - e.g. the two points aren't connected by any mapped footpath
 * (opposite sides of an ocean), or the service is briefly unreachable -
 * so the feature always returns *something* useful rather than failing.
 */
export async function routeBetween(from: Place, to: Place): Promise<RouteResult> {
  const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as OsrmResponse;
      const route = data.routes?.[0];
      if (data.code === 'Ok' && route) {
        return {
          from,
          to,
          km: route.distance / 1000,
          coordinates: route.geometry.coordinates,
          routed: true,
        };
      }
    }
  } catch {
    // Falls through to the straight-line fallback below.
  }

  return {
    from,
    to,
    km: haversineKm(from, to),
    coordinates: [
      [from.lng, from.lat],
      [to.lng, to.lat],
    ],
    routed: false,
  };
}
