import { api } from "@/lib/api";

export const metadata = { title: "Leaderboard — RunOwn" };

export default async function LeaderboardPage() {
  const rows = await api.leaderboard();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Leaderboard</h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">Ranked by territories currently owned.</p>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 p-6 text-center text-zinc-500 dark:border-white/15">
          Nobody owns any turf yet — or the RunOwn API isn&apos;t reachable right now.
        </p>
      ) : (
        <ol className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          {rows.map((row, i) => (
            <li
              key={row.id}
              className="flex items-center justify-between border-t border-black/5 px-4 py-3 first:border-t-0 dark:border-white/5"
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-sm text-zinc-500">#{i + 1}</span>
                <span className="font-medium">{row.name}</span>
              </div>
              <span className="text-sm text-zinc-500">
                {row.territories_count} {row.territories_count === 1 ? "zone" : "zones"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
