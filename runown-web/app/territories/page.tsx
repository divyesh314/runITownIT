import { api } from "@/lib/api";

export const metadata = { title: "Territories — RunOwn" };

export default async function TerritoriesPage() {
  const territories = await api.listTerritories();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-2 font-display text-4xl tracking-wide">Territories</h1>
      <p className="mb-8 text-dim">
        Every zone on the map. Claim an empty one or challenge an owned one from the RunOwn app.
      </p>

      {territories.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-xl border border-hairline">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2">
              <tr className="font-mono text-xs tracking-wide text-dim uppercase">
                <th className="px-4 py-3 font-semibold">Zone</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Claimed</th>
              </tr>
            </thead>
            <tbody className="bg-surface">
              {territories.map((t) => (
                <tr key={t.id} className="border-t border-hairline">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">
                    {t.owner ? (
                      <span className="font-medium text-ember">{t.owner.name}</span>
                    ) : (
                      <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-xs text-dim uppercase">
                        Unclaimed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-dim">
                    {t.lat.toFixed(4)}, {t.lng.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-dim">
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
    <p className="rounded-lg border border-dashed border-hairline p-6 text-center text-dim">
      No territories to show yet — either nobody has claimed one, or the RunOwn API isn&apos;t
      reachable right now.
    </p>
  );
}
