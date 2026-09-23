import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { getSession } from '@/lib/session';
import { logoutAction } from '@/app/actions/auth';

const links = [
  { href: '/', label: 'Home' },
  { href: '/territories', label: 'Territories' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export async function Nav() {
  const session = await getSession();

  return (
    <header className="border-b border-hairline bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="hex-mark" aria-hidden="true" />
          <span className="font-display text-xl tracking-wide">RUNOWN</span>
        </Link>
        <div className="flex items-center gap-6">
          <nav className="flex gap-6 font-mono text-xs font-medium tracking-wide uppercase text-dim">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-ember">
                {link.label}
              </Link>
            ))}
          </nav>

          {session ? (
            <div className="flex items-center gap-3">
              <Link
                href="/runs/new"
                className="rounded-full bg-ember px-4 py-1.5 font-mono text-xs font-bold tracking-wide text-ember-ink uppercase transition-opacity hover:opacity-90"
              >
                Add a run
              </Link>
              <span className="hidden font-mono text-xs text-dim sm:inline">{session.name}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="font-mono text-xs font-medium tracking-wide text-dim uppercase transition-colors hover:text-ember"
                >
                  Log out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="font-mono text-xs font-bold tracking-wide text-dim uppercase transition-colors hover:text-ember"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-ember px-4 py-1.5 font-mono text-xs font-bold tracking-wide text-ember uppercase transition-colors hover:bg-ember hover:text-ember-ink"
              >
                Sign up
              </Link>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
