import Constants from 'expo-constants';

import type { LatLng } from './geo';

const API_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://localhost:3000/api';

export type User = { id: number; name: string; email: string };
export type Territory = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  owner: User | null;
  claimed_at: string | null;
};
export type Run = {
  id: number;
  duration: number | null;
  distance: number | null;
  verified: boolean;
  territory_id: number | null;
};
export type Challenge = {
  id: number;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  challenger: User;
  territory: Territory;
  winner: User | null;
};
export type LeaderboardRow = { id: number; name: string; territories_count: number };

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let authToken: string | null = null;

/** Called once after loading (or clearing) the persisted token - see AuthContext. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error ?? data?.errors?.join(', ') ?? `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const api = {
  signup: (name: string, email: string, password: string) =>
    request<{ user: User; token: string }>('/signup', { method: 'POST', body: { name, email, password } }),

  login: (email: string, password: string) =>
    request<{ user: User; token: string }>('/login', { method: 'POST', body: { email, password } }),

  logout: () => request<void>('/logout', { method: 'DELETE' }),

  listTerritories: () => request<Territory[]>('/territories'),

  claimTerritory: (point: LatLng, name?: string) =>
    request<{ message: string; territory: Territory } | { error: string; territory: Territory }>(
      '/territories/claim',
      { method: 'POST', body: { lat: point.lat, lng: point.lng, name } }
    ),

  startRun: (territoryId?: number) =>
    request<Run>('/runs/start', { method: 'POST', body: { territory_id: territoryId } }),

  verifyRun: (runId: number, path: LatLng[], durationSeconds: number) =>
    request<{ message: string; run: Run; error?: string }>(`/runs/${runId}/verify`, {
      method: 'POST',
      body: { gps_data: path, duration: Math.max(1, Math.round(durationSeconds / 60)) },
    }),

  myRuns: () => request<Run[]>('/runs'),

  leaderboard: () => request<LeaderboardRow[]>('/leaderboard'),

  listChallenges: () => request<Challenge[]>('/challenges'),

  createChallenge: (territoryId: number) =>
    request<Challenge>('/challenges', { method: 'POST', body: { territory_id: territoryId } }),

  acceptChallenge: (id: number) => request<Challenge>(`/challenges/${id}/accept`, { method: 'POST' }),

  declineChallenge: (id: number) => request<Challenge>(`/challenges/${id}/decline`, { method: 'POST' }),

  completeChallenge: (id: number, winnerId: number) =>
    request<Challenge>(`/challenges/${id}/complete`, { method: 'POST', body: { winner_id: winnerId } }),
};

export { ApiError };
