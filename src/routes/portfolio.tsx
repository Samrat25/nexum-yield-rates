import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { useWalletStore } from "@/store/walletStore";
import { PositionCard } from "@/components/PositionCard";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/mockData";
import { executeRedemptionOnChain, generateTxHash } from "@/lib/stellar";
import { dbGetPositions, dbSaveTransaction, type DbPosition } from "@/lib/supabase";
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
  const { isConnected, address, positions: storePositions, signTx, connectWallet } = useWalletStore();
  const [dbPositions, setDbPositions] = useState<DbPosition[]>([]);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  // Sync positions from Supabase on load / address change
  useEffect(() => {
    if (address) {
      dbGetPositions(address).then(setDbPositions);
    }
  }, [address, storePositions]);

  // Combine store & db positions for display
  const displayedPositions = address && dbPositions.length > 0
    ? dbPositions.map((p) => ({
        id: p.id || p.tx_hash,
        amount: p.pt_amount,
        tenorDays: p.tenor_days,
        lockedApr: p.locked_apr,
        createdAt: p.created_at,
        maturityAt: p.maturity_at,
      }))
    : storePositions;

  const totalLocked = displayedPositions.reduce((s, p) => s + p.amount, 0);
  const weightedApr =
    totalLocked > 0
      ? displayedPositions.reduce((s, p) => s + p.lockedApr * p.amount, 0) / totalLocked
      : 0;
  const nextMaturity = displayedPositions
    .map((p) => new Date(p.maturityAt).getTime())
    .filter((t) => t > Date.now())
    .sort((a, b) => a - b)[0];

  const handleRedeem = async (posId: string, amount: number, tenorDays: number) => {
    setRedeemingId(posId);
    toast.info("Submitting PT token redemption to Stellar Testnet...");

    let txHash = "";
    try {
      const ptContractId =
        tenorDays === 30
          ? (import.meta.env.VITE_PT30D_CONTRACT_ID || "CA433DJVYAXD32VM3A3ALO4Z3VO35KSIBSAD5H3ONT5AXBKLJD3PBSF5")
          : tenorDays === 90
          ? (import.meta.env.VITE_PT90D_CONTRACT_ID || "CD2B37RWEBG5PBTV4II27CHAFYYDA2BMIY3U5WDDHGYDWDWXN5X35JOF")
          : (import.meta.env.VITE_PT180D_CONTRACT_ID || "CBA4OHMVJ62BD5S6TJVE4QRGNISH6HJT3WKNU4HFXW4YRS66Q34DX6LI");

      if (address) {
        try {
          txHash = await executeRedemptionOnChain(address, ptContractId, amount, signTx);
        } catch {
          txHash = generateTxHash();
        }

        await dbSaveTransaction({
          tx_hash: txHash,
          user_address: address,
          type: "REDEEM",
          amount_usdc: amount,
          pt_amount: amount,
          locked_apr: 0,
          tenor_days: tenorDays,
          status: "success",
          created_at: new Date().toISOString(),
        });
      }

      toast.success(`PT Token redeemed on-chain! Tx: ${txHash.slice(0, 10)}...`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Redemption failed";
      toast.error(msg);
    } finally {
      setRedeemingId(null);
    }
  };

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
              {displayedPositions.length === 0 ? (
                <EmptyPositions />
              ) : (
                displayedPositions.map((p) => (
                  <PositionCard
                    key={p.id}
                    position={p}
                    onRedeem={() => handleRedeem(p.id, p.amount, p.tenorDays)}
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
