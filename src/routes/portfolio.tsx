import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { useWalletStore } from "@/store/walletStore";
import { PositionCard } from "@/components/PositionCard";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/mockData";
import { Wallet, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Nexum Protocol" },
      { name: "description", content: "Track your active fixed-rate positions on Nexum." },
      { property: "og:title", content: "Portfolio — Nexum Protocol" },
      { property: "og:description", content: "Your active fixed-rate positions on Stellar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { isConnected, address, positions, connectWallet } = useWalletStore();

  const totalLocked = positions.reduce((s, p) => s + p.amount, 0);
  const weightedApr =
    totalLocked > 0
      ? positions.reduce((s, p) => s + p.lockedApr * p.amount, 0) / totalLocked
      : 0;
  const nextMaturity = positions
    .map((p) => new Date(p.maturityAt).getTime())
    .filter((t) => t > Date.now())
    .sort((a, b) => a - b)[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-3xl">My Positions</h1>
            {isConnected && (
              <p className="mt-1 text-sm text-muted-foreground tabular">
                {truncateAddress(address)}
              </p>
            )}
          </div>
        </div>

        {!isConnected ? (
          <EmptyConnect onConnect={() => connectWallet()} />
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <SummaryCard label="Total Locked" value={`${totalLocked.toFixed(2)} USDC`} />
              <SummaryCard
                label="Avg Locked APR"
                value={`${weightedApr.toFixed(2)}%`}
                accent
              />
              <SummaryCard
                label="Next Maturity"
                value={
                  nextMaturity
                    ? new Date(nextMaturity).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"
                }
              />
            </div>

            <div className="mt-8 space-y-4">
              {positions.length === 0 ? (
                <EmptyPositions />
              ) : (
                positions.map((p) => (
                  <PositionCard
                    key={p.id}
                    position={p}
                    onRedeem={() => toast.success("Redeem simulated (contract wiring coming soon)")}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`tabular mt-2 text-2xl font-bold ${accent ? "text-success" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function EmptyConnect({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="mt-16 flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface p-12 text-center">
      <div className="rounded-full border border-border bg-background p-4">
        <Wallet className="h-6 w-6 text-primary" />
      </div>
      <h2 className="text-lg font-semibold">Connect your wallet</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Sign in with Freighter to view your Nexum positions and manage maturities.
      </p>
      <Button
        onClick={onConnect}
        className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
      >
        Connect Wallet
      </Button>
    </div>
  );
}

function EmptyPositions() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-surface/40 p-16 text-center">
      <div className="rounded-full border border-border bg-background p-4">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">
        No active positions. Go to Trade to lock your first rate.
      </p>
      <Button
        asChild
        className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
      >
        <Link to="/trade">Open Trade</Link>
      </Button>
    </div>
  );
}
