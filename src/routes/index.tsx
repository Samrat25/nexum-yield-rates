import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock, Zap, ArrowRight, Github } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexum Protocol — Fixed-Rate Yield on Stellar" },
      {
        name: "description",
        content:
          "Nexum brings fixed-rate DeFi to Stellar. Lock your APR with a rate-or-revert intent — or your funds return automatically.",
      },
      { property: "og:title", content: "Nexum Protocol — Fixed-Rate Yield on Stellar" },
      {
        property: "og:description",
        content: "Lock your yield. Own your rate. Fixed-rate DeFi on Stellar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-success" />
            Live on Stellar Testnet
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Lock your yield.{" "}
            <span className="text-primary">Own your rate.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Nexum brings fixed-rate DeFi to Stellar — execute a rate intent and your APR is
            guaranteed, or your funds return automatically.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-md bg-primary px-6 text-primary-foreground hover:bg-primary/90 glow-primary"
            >
              <Link to="/trade">
                Launch App <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-md border-border bg-transparent px-6"
            >
              <Link to="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Value Locked" value="$0" hint="Testnet · placeholder" />
          <StatCard label="Current Vault APY" value="15.2%" hint="Updated 30s ago" accent />
          <StatCard label="Active Positions" value="0" hint="Across all users" />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Rate-or-Revert"
            desc="Your intent only executes if the market can hit your target APR. Otherwise, funds return in the same transaction."
          />
          <FeatureCard
            icon={<Lock className="h-5 w-5" />}
            title="Fixed APR"
            desc="No variable yield roulette. Lock a rate for 30, 90, or 180 days and know exactly what your PT tokens mature to."
          />
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Stellar Native"
            desc="Built on Soroban with sub-second finality and near-zero fees. USDC in, PT tokens out."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-surface/40">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">How it works</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            A single intent flows through four contracts. Deterministic. Atomic. On-chain.
          </p>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: 1, t: "Deposit USDC", d: "Bring stablecoins to the Nexum vault." },
              { n: 2, t: "Vault mints shares", d: "Your deposit is tokenized as vault shares." },
              { n: 3, t: "Intent Router locks rate", d: "Router matches your target APR — or reverts." },
              { n: 4, t: "PT tokens mature to par", d: "Redeem 1:1 for USDC at maturity." },
            ].map((s) => (
              <li key={s.n} className="rounded-xl border border-border bg-surface p-5">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-sm font-semibold text-primary">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">© 2026 Nexum Protocol</p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Github className="h-4 w-4" /> GitHub
            </a>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Built on Stellar
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`tabular mt-2 text-3xl font-bold ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-primary/40">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
