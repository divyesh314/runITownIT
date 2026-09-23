'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import type { Map as LeafletMap, Marker, Polyline } from 'leaflet';
import { AddressAutocomplete } from '@/components/address-autocomplete';
import { routeBetween, type Place, type RouteResult } from '@/app/actions/geocode';

const START_COLOR = '#e44a26';
const END_COLOR = '#b9860b';

// Custom colored-dot markers instead of Leaflet's default pin icon: the
// default marker image path breaks under Next.js/webpack bundling (a
// well-known Leaflet issue), and this also matches the RunOwn ember/gold
// palette instead of Leaflet's stock blue pin.
function dotIcon(L: typeof import('leaflet'), color: string) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export function RunDistanceMap() {
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRouting, startRouting] = useTransition();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const startMarkerRef = useRef<Marker | null>(null);
  const endMarkerRef = useRef<Marker | null>(null);
  const routeLineRef = useRef<Polyline | null>(null);

  // Show the map as soon as either point is picked - not only after
  // Calculate - so the person sees their pin land immediately, the way the
  // mobile app's live GPS view would show your current position right away.
  const showMap = Boolean(from || to);

  // One effect creates the map (the first time there's a point to show)
  // and keeps markers + the route line in sync on every change after that.
  // Deliberately one effect, not "create" + separate "sync": splitting them
  // would race the async `import('leaflet')` against state updates. No
  // setState call lives inside this effect - only imperative Leaflet calls
  // - so it doesn't trip the react-hooks/set-state-in-effect rule.
  useEffect(() => {
    if (!showMap || !mapContainerRef.current) return;

    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !mapContainerRef.current) return;

      if (!mapRef.current) {
        const map = L.map(mapContainerRef.current).setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
      }
      const map = mapRef.current;

      if (from) {
        if (!startMarkerRef.current) {
          startMarkerRef.current = L.marker([from.lat, from.lng], {
            icon: dotIcon(L, START_COLOR),
          }).addTo(map);
        } else {
          startMarkerRef.current.setLatLng([from.lat, from.lng]);
        }
        startMarkerRef.current.bindPopup(`Start: ${from.label}`);
      } else if (startMarkerRef.current) {
        startMarkerRef.current.remove();
        startMarkerRef.current = null;
      }

      if (to) {
        if (!endMarkerRef.current) {
          endMarkerRef.current = L.marker([to.lat, to.lng], {
            icon: dotIcon(L, END_COLOR),
          }).addTo(map);
        } else {
          endMarkerRef.current.setLatLng([to.lat, to.lng]);
        }
        endMarkerRef.current.bindPopup(`Finish: ${to.label}`);
      } else if (endMarkerRef.current) {
        endMarkerRef.current.remove();
        endMarkerRef.current = null;
      }

      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }

      if (result) {
        // GeoJSON coordinates come as [lng, lat]; Leaflet wants [lat, lng].
        const points: [number, number][] = result.coordinates.map(([lng, lat]) => [lat, lng]);
        routeLineRef.current = L.polyline(points, {
          color: START_COLOR,
          weight: 4,
          ...(result.routed ? {} : { dashArray: '6 6' }),
        }).addTo(map);
        map.fitBounds(routeLineRef.current.getBounds(), { padding: [32, 32] });
      } else if (from && to) {
        map.fitBounds(L.latLngBounds([from.lat, from.lng], [to.lat, to.lng]), {
          padding: [48, 48],
        });
      } else if (from) {
        map.setView([from.lat, from.lng], 13);
      } else if (to) {
        map.setView([to.lat, to.lng], 13);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [showMap, from, to, result]);

  // Tear the map instance down when this component unmounts.
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      startMarkerRef.current = null;
      endMarkerRef.current = null;
      routeLineRef.current = null;
    };
  }, []);

  // Cleared directly in these handlers (not via a useEffect keyed on
  // from/to) so a stale result/error never lingers after a new pick, without
  // calling setState from inside an effect body.
  function handleSelectFrom(place: Place) {
    setFrom(place);
    setResult(null);
    setError(null);
  }

  function handleSelectTo(place: Place) {
    setTo(place);
    setResult(null);
    setError(null);
  }

  function handleCalculate() {
    if (!from || !to) return;
    setError(null);
    startRouting(async () => {
      try {
        const routed = await routeBetween(from, to);
        setResult(routed);
      } catch {
        setError("Couldn't calculate a route between those two points. Try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <AddressAutocomplete
          id="from"
          label="From address"
          placeholder="e.g. Waterloo Park, Waterloo, ON"
          onSelect={handleSelectFrom}
        />
        <AddressAutocomplete
          id="to"
          label="To address"
          placeholder="e.g. University of Waterloo"
          onSelect={handleSelectTo}
        />
        <button
          type="button"
          onClick={handleCalculate}
          disabled={!from || !to || isRouting}
          className="rounded-full bg-ember px-5 py-2.5 font-mono text-sm font-bold tracking-wide text-ember-ink uppercase transition-opacity hover:opacity-90 disabled:opacity-60 sm:mt-7"
        >
          {isRouting ? 'Routing…' : 'Calculate'}
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-ember">
          {error}
        </p>
      )}

      {result && (
        <div className="flex items-baseline gap-3 rounded-lg border border-hairline bg-surface-2 px-4 py-3">
          <span className="font-mono text-4xl font-bold tabular-nums text-ember">
            {result.km.toFixed(2)}
          </span>
          <span className="font-mono text-xs font-bold tracking-wide text-dim uppercase">
            kilometers {result.routed ? '(running route)' : '(straight-line — no route found here)'}
          </span>
        </div>
      )}

      {showMap && (
        <div
          ref={mapContainerRef}
          className="h-80 w-full overflow-hidden rounded-lg border border-hairline"
        />
      )}
    </div>
  );
}
