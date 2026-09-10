import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/territories', label: 'Territories' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export function Nav() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          🏃 RunOwn
        </Link>
        <nav className="flex gap-6 text-sm font-medium">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="opacity-80 hover:opacity-100">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
