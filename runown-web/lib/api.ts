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

export type AuthUser = { id: number; name: string; email: string };
export type AuthResult =
  | { ok: true; user: AuthUser; token: string }
  | { ok: false; error: string };

/**
 * Posts to the Rails auth endpoints and normalizes both Rails' error shapes
 * (`{ error }` from sessions#create, `{ errors: [...] }` from
 * users#create's validation failures) into one `AuthResult` the UI can
 * render directly, rather than throwing - a wrong password is an expected
 * outcome here, not an exceptional one.
 */
async function postAuth(path: string, body: unknown): Promise<AuthResult> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}) as Record<string, unknown>);

    if (!res.ok) {
      const message = Array.isArray(data.errors)
        ? data.errors.join(', ')
        : typeof data.error === 'string'
          ? data.error
          : 'Something went wrong - try again.';
      return { ok: false, error: message };
    }

    return { ok: true, user: data.user as AuthUser, token: data.token as string };
  } catch {
    return { ok: false, error: "Can't reach the RunOwn API right now." };
  }
}

export const api = {
  listTerritories: () => safeGet<Territory[]>('/territories', []),
  leaderboard: () => safeGet<LeaderboardRow[]>('/leaderboard', []),

  signup: (name: string, email: string, password: string) =>
    postAuth('/signup', { name, email, password }),
  login: (email: string, password: string) => postAuth('/login', { email, password }),
  logout: (token: string) =>
    fetch(`${API_URL}/logout`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }).catch(() => {
      // Logging out is best-effort here: even if this fails (API down,
      // network hiccup), clearing the local session cookie still signs the
      // browser out - see clearSession() in lib/session.ts.
    }),
};

export { API_URL };
