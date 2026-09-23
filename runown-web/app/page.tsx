import Link from "next/link";
import { api } from "@/lib/api";

export default async function Home() {
  const [territories, leaderboard] = await Promise.all([
    api.listTerritories(),
    api.leaderboard(),
  ]);

  const claimed = territories.filter((t) => t.owner).length;
  const players = leaderboard.length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <section className="flex flex-col gap-6 py-12 text-center sm:text-left">
        <span className="mx-auto font-mono text-xs font-bold tracking-[0.14em] text-ember uppercase sm:mx-0">
          Run. Claim. Defend.
        </span>
        <h1 className="font-display text-6xl leading-[0.94] tracking-wide text-balance sm:text-7xl">
          Claim the map.
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-dim sm:mx-0">
          RunOwn turns your city into a map of turf. Run through a zone to claim it, challenge
          whoever owns a zone you want, and see who&apos;s really covering the most ground.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-start justify-center">
          <Link
            href="/territories"
            className="rounded-full bg-ember px-6 py-3 text-center font-semibold text-ember-ink hover:opacity-90"
          >
            See the map
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-full border-[1.5px] border-ember px-6 py-3 text-center font-semibold text-ember hover:bg-ember/10"
          >
            View leaderboard
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 border-t border-hairline py-10 sm:grid-cols-3">
        <Stat label="Territories claimed" value={claimed} />
        <Stat label="Territories on the map" value={territories.length} />
        <Stat label="Players" value={players} />
      </section>

      <section className="grid grid-cols-1 gap-8 border-t border-hairline py-12 sm:grid-cols-3">
        <Step
          number={1}
          title="Run"
          body="Open the RunOwn app and go for a run. Your GPS path is recorded the whole way."
        />
        <Step
          number={2}
          title="Claim"
          body="Pass through an unclaimed zone and it's automatically yours once your run is verified."
        />
        <Step
          number={3}
          title="Defend"
          body="Someone want your turf? They challenge you. Whoever wins the race keeps the zone."
        />
      </section>

      {territories.length === 0 && (
        <p className="rounded-lg border border-dashed border-hairline p-4 text-sm text-dim">
          Can&apos;t reach the RunOwn API right now, so live stats aren&apos;t shown. Start the
          backend (<code>runown-backend</code>) and refresh this page.
        </p>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-6 text-center">
      <div className="font-mono text-3xl font-bold tabular-nums text-ember">{value}</div>
      <div className="mt-1 text-sm text-dim">{label}</div>
    </div>
  );
}

function Step({ number, title, body }: { number: number; title: string; body: string }) {
  return (
    <div>
      <div className="mb-2 font-mono text-sm font-bold text-ember">0{number}</div>
      <h3 className="mb-2 font-display text-2xl tracking-wide">{title}</h3>
      <p className="text-dim">{body}</p>
    </div>
  );
}
