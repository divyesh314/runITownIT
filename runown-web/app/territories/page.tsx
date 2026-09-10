import { api } from "@/lib/api";

export const metadata = { title: "Territories — RunOwn" };

export default async function TerritoriesPage() {
  const territories = await api.listTerritories();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Territories</h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">
        Every zone on the map. Claim an empty one or challenge an owned one from the RunOwn app.
      </p>

      {territories.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 font-medium">Zone</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Claimed</th>
              </tr>
            </thead>
            <tbody>
              {territories.map((t) => (
                <tr key={t.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">
                    {t.owner ? (
                      t.owner.name
                    ) : (
                      <span className="text-zinc-400">Unclaimed</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {t.lat.toFixed(4)}, {t.lng.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {t.claimed_at ? new Date(t.claimed_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <p className="rounded-lg border border-dashed border-black/15 p-6 text-center text-zinc-500 dark:border-white/15">
      No territories to show yet — either nobody has claimed one, or the RunOwn API isn&apos;t
      reachable right now.
    </p>
  );
}
