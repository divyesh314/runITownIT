export type Owner = { id: number; name: string; email: string };
export type Territory = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  owner: Owner | null;
  claimed_at: string | null;
};
export type LeaderboardRow = { id: number; name: string; territories_count: number };

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

/**
 * Fetches from the Rails API and always resolves (never throws): server
 * components render this dashboard even when nobody has the backend
 * running locally, they just show an empty/"can't reach the API" state
 * instead of crashing the page.
 */
async function safeGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export const api = {
  listTerritories: () => safeGet<Territory[]>('/territories', []),
  leaderboard: () => safeGet<LeaderboardRow[]>('/leaderboard', []),
};

export { API_URL };
