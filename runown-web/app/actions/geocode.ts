'use server';

export type GeocodeResult =
  | { ok: true; from: { label: string; lat: number; lng: number }; to: { label: string; lat: number; lng: number }; km: number }
  | { ok: false; error: string };

export type GeocodeFormState = GeocodeResult | { ok: null };

const EARTH_RADIUS_KM = 6371;

/**
 * Straight-line ("as the crow flies") distance, not a routed distance - this
 * feature is a quick estimate for now, not real GPS-tracked mileage. Mirrors
 * the haversine formula the Rails backend's GpsValidator already uses.
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

/**
 * Nominatim (OpenStreetMap's free geocoder) requires a descriptive
 * User-Agent and asks callers not to hammer it - this runs server-side (a
 * Server Action) specifically so that header can be set at all, which a
 * browser `fetch` would silently strip.
 */
async function geocodeOne(address: string): Promise<{ label: string; lat: number; lng: number } | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', address);

  const res = await fetch(url, {
    headers: { 'User-Agent': 'RunOwn/1.0 (running app add-a-run feature)' },
    cache: 'no-store',
  });
  if (!res.ok) return null;

  const hits = (await res.json()) as NominatimHit[];
  const hit = hits[0];
  if (!hit) return null;

  return { label: hit.display_name, lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) };
}

export async function calculateRunAction(
  _prevState: GeocodeFormState,
  formData: FormData,
): Promise<GeocodeResult> {
  const fromAddress = String(formData.get('from') ?? '').trim();
  const toAddress = String(formData.get('to') ?? '').trim();

  if (!fromAddress || !toAddress) {
    return { ok: false, error: 'Enter both a starting address and an ending address.' };
  }

  // Sequential, not Promise.all: Nominatim's usage policy asks for roughly
  // one request per second, not concurrent bursts.
  const from = await geocodeOne(fromAddress);
  if (!from) {
    return { ok: false, error: `Couldn't find "${fromAddress}". Try a more specific address.` };
  }

  const to = await geocodeOne(toAddress);
  if (!to) {
    return { ok: false, error: `Couldn't find "${toAddress}". Try a more specific address.` };
  }

  const km = haversineKm(from, to);
  return { ok: true, from, to, km };
}
