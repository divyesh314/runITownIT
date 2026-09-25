'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import type { Map as LeafletMap, Marker, Polyline } from 'leaflet';
import { AddressAutocomplete } from '@/components/address-autocomplete';
import {
  routeBetween,
  getElevationProfile,
  type Place,
  type RouteOption,
  type RouteResult,
  type ElevationProfile,
} from '@/app/actions/geocode';

const START_COLOR = '#e44a26';
const END_COLOR = '#b9860b';

// Simple, pace-independent running-calorie estimate (calories burned per km
// scales close to linearly with body weight for running - roughly
// 1.036 kcal per kg per km is a commonly cited estimate). This is a UI/UX
// stand-in: the real mobile app would use the runner's actual profile
// weight and GPS-measured pace instead of this fixed default.
const ASSUMED_WEIGHT_KG = 70;
function estimateCalories(km: number): number {
  return Math.round(km * ASSUMED_WEIGHT_KG * 1.036);
}

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
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [elevation, setElevation] = useState<ElevationProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRouting, startRouting] = useTransition();
  const [isLoadingElevation, startElevation] = useTransition();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const startMarkerRef = useRef<Marker | null>(null);
  const endMarkerRef = useRef<Marker | null>(null);
  const routeLineRef = useRef<Polyline | null>(null);

  const selectedRoute: RouteOption | null = routeResult?.routes[selectedRouteIndex] ?? null;

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

      if (selectedRoute) {
        // GeoJSON coordinates come as [lng, lat]; Leaflet wants [lat, lng].
        const points: [number, number][] = selectedRoute.coordinates.map(([lng, lat]) => [
          lat,
          lng,
        ]);
        routeLineRef.current = L.polyline(points, {
          color: START_COLOR,
          weight: 4,
          ...(selectedRoute.routed ? {} : { dashArray: '6 6' }),
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
  }, [showMap, from, to, selectedRoute]);

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
    setRouteResult(null);
    setElevation(null);
    setError(null);
  }

  function handleSelectTo(place: Place) {
    setTo(place);
    setRouteResult(null);
    setElevation(null);
    setError(null);
  }

  function loadElevationFor(route: RouteOption) {
    setElevation(null);
    startElevation(async () => {
      const profile = await getElevationProfile(route.coordinates);
      setElevation(profile);
    });
  }

  function handleCalculate() {
    if (!from || !to) return;
    setError(null);
    startRouting(async () => {
      try {
        const routed = await routeBetween(from, to);
        setRouteResult(routed);
        setSelectedRouteIndex(0);
        loadElevationFor(routed.routes[0]);
      } catch {
        setError("Couldn't calculate a route between those two points. Try again.");
      }
    });
  }

  function handleSelectRoute(index: number) {
    if (!routeResult) return;
    setSelectedRouteIndex(index);
    loadElevationFor(routeResult.routes[index]);
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

      {routeResult && routeResult.routes.length > 1 && (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs font-bold tracking-wide text-dim uppercase">
            {routeResult.routes.length} routes found - pick one
          </span>
          <div className="flex flex-wrap gap-2">
            {routeResult.routes.map((route, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectRoute(index)}
                aria-pressed={index === selectedRouteIndex}
                className={`rounded-full border-[1.5px] px-4 py-2 font-mono text-xs font-bold uppercase transition-colors ${
                  index === selectedRouteIndex
                    ? 'border-ember bg-ember text-ember-ink'
                    : 'border-hairline text-dim hover:border-ember hover:text-ember'
                }`}
              >
                Route {index + 1} · {route.km.toFixed(2)} km
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedRoute && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            value={selectedRoute.km.toFixed(2)}
            unit="kilometers"
            note={selectedRoute.routed ? 'running route' : 'straight-line — no route found here'}
          />
          <StatTile
            value={isLoadingElevation ? '…' : elevation ? `+${elevation.gainMeters}` : '—'}
            unit="meters"
            note={isLoadingElevation ? 'checking elevation' : elevation ? 'elevation gain' : 'elevation unavailable'}
          />
          <StatTile
            value={estimateCalories(selectedRoute.km).toString()}
            unit="calories"
            note={`est., ${ASSUMED_WEIGHT_KG}kg runner`}
          />
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

function StatTile({ value, unit, note }: { value: string; unit: string; note: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-hairline bg-surface-2 px-4 py-3">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-3xl font-bold tabular-nums text-ember">{value}</span>
        <span className="font-mono text-[0.65rem] font-bold tracking-wide text-dim uppercase">
          {unit}
        </span>
      </div>
      <span className="text-xs text-dim">{note}</span>
    </div>
  );
}
