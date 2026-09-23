import { api } from "@/lib/api";

export const metadata = { title: "Leaderboard — RunOwn" };

export default async function LeaderboardPage() {
  const rows = await api.leaderboard();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-2 font-display text-4xl tracking-wide">Leaderboard</h1>
      <p className="mb-8 text-dim">Ranked by territories currently owned.</p>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-hairline p-6 text-center text-dim">
          Nobody owns any turf yet — or the RunOwn API isn&apos;t reachable right now.
        </p>
      ) : (
        <ol className="overflow-hidden rounded-xl border border-hairline bg-surface">
          {rows.map((row, i) => (
            <li
              key={row.id}
              className="flex items-center justify-between border-t border-hairline px-4 py-3 first:border-t-0"
            >
              <div className="flex items-center gap-4">
                <span
                  className={`w-6 font-mono text-sm font-bold tabular-nums ${
                    i === 0 ? "text-gold" : "text-dim"
                  }`}
                >
                  #{i + 1}
                </span>
                <span className="font-medium">{row.name}</span>
              </div>
              <span className="font-mono text-sm font-bold tabular-nums text-ember">
                {row.territories_count}{" "}
                <span className="font-sans font-normal text-dim">
                  {row.territories_count === 1 ? "zone" : "zones"}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
