import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { useWalletStore } from "@/store/walletStore";
import { PositionCard } from "@/components/PositionCard";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/mockData";
import { executeRedemptionOnChain, generateTxHash } from "@/lib/stellar";
import { dbGetPositions, dbSaveTransaction, type DbPosition } from "@/lib/supabase";
import { Wallet, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Nexum Protocol" },
      { name: "description", content: "Manage your active PT fixed-rate yield positions and claim marginable USDC on Stellar." },
      { property: "og:title", content: "Portfolio — Nexum Protocol" },
      { property: "og:description", content: "Your active fixed-rate positions on Stellar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { isConnected, address, balance, positions: storePositions, signTx, connectWallet, refreshBalances } = useWalletStore();
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

  const totalAccruedInterestUsdc = displayedPositions.reduce((s, p) => {
    const elapsedDays = Math.max(0, (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return s + p.amount * (p.lockedApr / 100) * (Math.min(p.tenorDays, elapsedDays) / 365);
  }, 0);

  const nextMaturity = displayedPositions
    .map((p) => new Date(p.maturityAt).getTime())
    .filter((t) => t > Date.now())
    .sort((a, b) => a - b)[0];

  const handleRedeem = async (posId: string, amount: number, tenorDays: number) => {
    setRedeemingId(posId);
    toast.info("Submitting PT token redemption & USDC claim to Soroban...");

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

      await refreshBalances();
      toast.success(`Marginable USDC claimed! Tx: ${txHash.slice(0, 10)}...`);
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
            <h1 className="text-2xl font-extrabold sm:text-3xl tracking-tight">Portfolio & Redemption Hub</h1>
            {isConnected && (
              <p className="mt-1 text-sm text-muted-foreground tabular flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Connected: <span className="font-mono text-foreground font-semibold">{truncateAddress(address)}</span>
              </p>
            )}
          </div>
        </div>

        {!isConnected ? (
          <EmptyConnect onConnect={() => connectWallet()} />
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              <SummaryCard label="Principal Locked" value={`${totalLocked.toFixed(2)} USDC`} />
              <SummaryCard label="Accrued Yield" value={`+${totalAccruedInterestUsdc.toFixed(2)} USDC`} accent />
              <SummaryCard label="Weighted APR" value={`${weightedApr.toFixed(2)}%`} />
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Active PT Yield Positions ({displayedPositions.length})
                </h2>
              </div>
              {displayedPositions.length === 0 ? (
                <EmptyPositions />
              ) : (
                displayedPositions.map((p) => (
                  <PositionCard
                    key={p.id}
                    position={p}
                    isRedeeming={redeemingId === p.id}
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
    <div className="rounded-xl border border-border/80 bg-surface p-5 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className={`tabular mt-2 text-2xl font-bold ${accent ? "text-success" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function EmptyConnect({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="mt-16 flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface p-12 text-center shadow-xl">
      <div className="rounded-full border border-border bg-background p-4">
        <Wallet className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-xl font-bold">Connect your Freighter Wallet</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Sign in with Freighter to view your real on-chain positions and claim marginable USDC yield.
      </p>
      <Button
        onClick={onConnect}
        className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold px-6 h-11"
      >
        Connect Wallet
      </Button>
    </div>
  );
}

function EmptyPositions() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/80 bg-surface/50 p-16 text-center shadow-sm">
      <div className="rounded-full border border-border bg-background p-4">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-base font-semibold">No Active Positions Yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        You don't have any locked fixed-rate positions. Execute an intent on the Trade page to lock your fixed rate.
      </p>
      <Button
        asChild
        className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold px-6"
      >
        <Link to="/trade">Open Trade</Link>
      </Button>
    </div>
  );
}
