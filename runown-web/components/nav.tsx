import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/territories', label: 'Territories' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export function Nav() {
  return (
    <header className="border-b border-hairline bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="hex-mark" aria-hidden="true" />
          <span className="font-display text-xl tracking-wide">RUNOWN</span>
        </Link>
        <nav className="flex gap-6 font-mono text-xs font-medium tracking-wide uppercase text-dim">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-ember">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
