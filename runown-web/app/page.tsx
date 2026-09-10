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
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Claim territory by running through it.
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 sm:mx-0 mx-auto">
          RunOwn turns your city into a map of turf. Run through a zone to claim it, challenge
          whoever owns a zone you want, and see who&apos;s really covering the most ground.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-start justify-center">
          <Link
            href="/territories"
            className="rounded-full bg-foreground px-6 py-3 text-center font-medium text-background hover:opacity-90"
          >
            See the map
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-full border border-black/10 px-6 py-3 text-center font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
          >
            View leaderboard
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 border-t border-black/10 py-10 dark:border-white/10 sm:grid-cols-3">
        <Stat label="Territories claimed" value={claimed} />
        <Stat label="Territories on the map" value={territories.length} />
        <Stat label="Players" value={players} />
      </section>

      <section className="grid grid-cols-1 gap-8 border-t border-black/10 py-12 dark:border-white/10 sm:grid-cols-3">
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
        <p className="rounded-lg border border-dashed border-black/15 p-4 text-sm text-zinc-500 dark:border-white/15">
          Can&apos;t reach the RunOwn API right now, so live stats aren&apos;t shown. Start the
          backend (<code>runown-backend</code>) and refresh this page.
        </p>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-black/10 p-6 text-center dark:border-white/10">
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-zinc-500">{label}</div>
    </div>
  );
}

function Step({ number, title, body }: { number: number; title: string; body: string }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-zinc-500">Step {number}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400">{body}</p>
    </div>
  );
}
