'use client';

import { useActionState, useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { calculateRunAction, type GeocodeFormState } from '@/app/actions/geocode';

const initialState: GeocodeFormState = { ok: null };

export function RunDistanceMap() {
  const [state, formAction, pending] = useActionState(calculateRunAction, initialState);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (state.ok !== true || !mapContainerRef.current) return;

    let cancelled = false;

    // Dynamic import, not a top-level one: Leaflet touches `window` at
    // module load time, which breaks Next.js's server render of this
    // client component if it's imported statically.
    import('leaflet').then((L) => {
      if (cancelled || !mapContainerRef.current) return;

      mapRef.current?.remove();

      const map = L.map(mapContainerRef.current);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom colored-dot markers instead of Leaflet's default pin icon:
      // the default marker image path breaks under Next.js/webpack bundling
      // (a well-known Leaflet issue), and this also matches the RunOwn
      // ember/gold palette instead of Leaflet's stock blue pin.
      const dot = (color: string) =>
        L.divIcon({
          className: '',
          html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></span>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

      const from = state.from;
      const to = state.to;

      const startMarker = L.marker([from.lat, from.lng], { icon: dot('#e44a26') }).addTo(map);
      startMarker.bindPopup(`Start: ${from.label}`);

      const endMarker = L.marker([to.lat, to.lng], { icon: dot('#b9860b') }).addTo(map);
      endMarker.bindPopup(`Finish: ${to.label}`);

      const line = L.polyline(
        [
          [from.lat, from.lng],
          [to.lat, to.lng],
        ],
        { color: '#e44a26', weight: 3, dashArray: '6 6' },
      ).addTo(map);

      map.fitBounds(line.getBounds(), { padding: [32, 32] });
    });

    return () => {
      cancelled = true;
    };
  }, [state]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <label htmlFor="from" className="flex flex-1 flex-col gap-1.5">
          <span className="font-mono text-xs font-bold tracking-wide text-dim uppercase">From address</span>
          <input
            id="from"
            name="from"
            type="text"
            required
            placeholder="e.g. Waterloo Park, Waterloo, ON"
            className="rounded-lg border border-hairline bg-surface px-3 py-2.5 text-foreground outline-none transition-colors focus:border-ember"
          />
        </label>
        <label htmlFor="to" className="flex flex-1 flex-col gap-1.5">
          <span className="font-mono text-xs font-bold tracking-wide text-dim uppercase">To address</span>
          <input
            id="to"
            name="to"
            type="text"
            required
            placeholder="e.g. University of Waterloo"
            className="rounded-lg border border-hairline bg-surface px-3 py-2.5 text-foreground outline-none transition-colors focus:border-ember"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ember px-5 py-2.5 font-mono text-sm font-bold tracking-wide text-ember-ink uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? 'Calculating…' : 'Calculate'}
        </button>
      </form>

      {state.ok === false && (
        <p role="alert" className="rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-ember">
          {state.error}
        </p>
      )}

      {state.ok === true && (
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline gap-3 rounded-lg border border-hairline bg-surface-2 px-4 py-3">
            <span className="font-mono text-4xl font-bold tabular-nums text-ember">
              {state.km.toFixed(2)}
            </span>
            <span className="font-mono text-xs font-bold tracking-wide text-dim uppercase">
              kilometers (straight-line estimate)
            </span>
          </div>
          <div
            ref={mapContainerRef}
            className="h-80 w-full overflow-hidden rounded-lg border border-hairline"
          />
        </div>
      )}
    </div>
  );
}
