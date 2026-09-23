import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { RunDistanceMap } from '@/components/run-distance-map';

export const metadata = { title: 'Add a run — RunOwn' };

export default async function NewRunPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs font-bold tracking-wide text-ember uppercase">Log a run</p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">Add a run</h1>
      <p className="mt-4 max-w-xl text-dim">
        Start typing an address and pick it from the list. Each point drops a pin as soon as
        you choose it, then Calculate traces the actual walking/running route between them.
      </p>

      <div className="mt-10">
        <RunDistanceMap />
      </div>

      <p className="mt-8 rounded-lg border border-hairline bg-surface-2 px-4 py-3 text-sm text-dim">
        This is a preview of what the mobile app will show live from your GPS while you run — it
        won&apos;t claim territory yet. If no walking route is found between the two points,
        we fall back to a straight-line estimate instead.
      </p>
    </div>
  );
}
