import 'server-only';
import { cookies } from 'next/headers';

export type Session = { token: string; name: string };

const COOKIE_NAME = 'runown_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Reads the signed-in user's session from an httpOnly cookie. Server
 * Components/Actions only (the `server-only` import above throws a build
 * error if this ever gets pulled into client code) - the auth token never
 * needs to reach the browser's JS at all, which is the point of storing it
 * this way instead of in localStorage.
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (typeof parsed.token !== 'string' || typeof parsed.name !== 'string') return null;
    return { token: parsed.token, name: parsed.name };
  } catch {
    return null;
  }
}

export async function setSession(session: Session): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
