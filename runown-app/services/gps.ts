import * as Location from 'expo-location';

import type { LatLng } from './geo';

export async function ensureLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentPoint(): Promise<LatLng> {
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { lat: position.coords.latitude, lng: position.coords.longitude };
}

/** Streams GPS points every ~5s / 10m of movement, matching the "app pings the
 * API every 5 seconds" behavior described in the project README. Returns a
 * function that stops the stream. */
export async function watchPosition(onPoint: (point: LatLng) => void): Promise<() => void> {
  const subscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
    (position) => onPoint({ lat: position.coords.latitude, lng: position.coords.longitude })
  );

  return () => subscription.remove();
}
