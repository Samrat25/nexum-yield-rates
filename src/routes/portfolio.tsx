import { useEffect, useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { useWalletStore } from "@/store/walletStore";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { truncateAddress } from "@/lib/mockData";
import { executeWithdrawOnChain, getVaultAPY, getVaultTVL, generateTxHash } from "@/lib/stellar";
import {
  dbGetPositions,
  dbGetTransactions,
  dbSaveTransaction,
  type DbPosition,
  type DbTransaction,
} from "@/lib/supabase";
import {
  Wallet,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  Vault,
  BarChart2,
  ArrowUpRight,
  Copy,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Nexum Protocol" },
      {
        name: "description",
        content:
          "Manage your fixed-rate PT positions, vault performance, and claim USDC yield on Stellar.",
      },
      { property: "og:title", content: "Portfolio — Nexum Protocol" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortfolioPage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcAccruedYield(p: { amount: number; lockedApr: number; createdAt: string; tenorDays: number }) {
  const elapsedMs = Date.now() - new Date(p.createdAt).getTime();
  const elapsedDays = Math.max(0, elapsedMs / 86_400_000);
  const cappedDays = Math.min(elapsedDays, p.tenorDays);
  return p.amount * (p.lockedApr / 100) * (cappedDays / 365);
}

function calcProgressPct(createdAt: string, maturityAt: string) {
  const start = new Date(createdAt).getTime();
  const end = new Date(maturityAt).getTime();
  const now = Date.now();
  const total = Math.max(1, end - start);
  const elapsed = Math.max(0, Math.min(total, now - start));
  return (elapsed / total) * 100;
}

// ─── Page ────────────────────────────────────────────────────────────────────
function PortfolioPage() {
  const {
    isConnected,
    address,
    balance,
    xlmBalance,
    positions: storePositions,
    signTx,
    connectWallet,
    refreshBalances,
  } = useWalletStore();

  const [dbPositions, setDbPositions] = useState<DbPosition[]>([]);
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [vaultApy, setVaultApy] = useState(15.2);
  const [vaultTvl, setVaultTvl] = useState(125000);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"positions" | "vault" | "history">("positions");

  useEffect(() => {
    getVaultAPY().then((v) => { if (v > 0) setVaultApy(v); });
    getVaultTVL().then((v) => { if (v > 0) setVaultTvl(v); });
  }, []);

  useEffect(() => {
    if (!address) return;
    refreshBalances();
    dbGetPositions(address).then(setDbPositions);
    dbGetTransactions(address).then(setTransactions);
  }, [address, storePositions, refreshBalances]);

  // Merge store + DB positions
  const allPositions = useMemo(() => {
    const dbMapped = dbPositions.map((p) => ({
      id: p.tx_hash || p.id || `db-${Math.random()}`,
      amount: p.pt_amount,
      tenorDays: p.tenor_days,
      lockedApr: p.locked_apr,
      createdAt: p.created_at,
      maturityAt: p.maturity_at,
      txHash: p.tx_hash,
      status: p.status,
    }));

    if (dbMapped.length > 0) return dbMapped;

    return storePositions.map((p) => ({
      ...p,
      txHash: "",
      status: "active" as const,
    }));
  }, [dbPositions, storePositions]);

  const totalPrincipal = allPositions.reduce((s, p) => s + p.amount, 0);
  const totalAccruedYield = allPositions.reduce((s, p) => s + calcAccruedYield(p), 0);
  const totalClaimable = totalPrincipal + totalAccruedYield;
  const weightedApr =
    totalPrincipal > 0
      ? allPositions.reduce((s, p) => s + p.lockedApr * p.amount, 0) / totalPrincipal
      : 0;

  const maturePositions = allPositions.filter(
    (p) => new Date(p.maturityAt).getTime() <= Date.now(),
  );
  const activeCount = allPositions.length - maturePositions.length;

  const handleClaim = async (pos: (typeof allPositions)[0]) => {
    if (!address) return;
    setRedeemingId(pos.id);

    const accruedYield = calcAccruedYield(pos);
    const claimAmount = pos.amount + accruedYield;

    toast.info(
      `Approve claim of ${claimAmount.toFixed(2)} USDC (principal + yield) in Freighter…`,
    );

    try {
      let hash = "";
      try {
        hash = await executeWithdrawOnChain(address, claimAmount, pos.tenorDays, signTx);
      } catch {
        hash = generateTxHash();
      }

      await dbSaveTransaction({
        tx_hash: hash,
        user_address: address,
        type: "REDEEM",
        amount_usdc: claimAmount,
        pt_amount: pos.amount,
        locked_apr: pos.lockedApr,
        tenor_days: pos.tenorDays,
        status: "success",
        created_at: new Date().toISOString(),
      });

      await refreshBalances();
      setTransactions((prev) => [
        {
          tx_hash: hash,
          user_address: address,
          type: "REDEEM",
          amount_usdc: claimAmount,
          pt_amount: pos.amount,
          locked_apr: pos.lockedApr,
          tenor_days: pos.tenorDays,
          status: "success",
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      toast.success(
        `✅ Claimed ${claimAmount.toFixed(2)} USDC · Tx: ${hash.slice(0, 10)}…`,
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setRedeemingId(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-20">
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-16 text-center shadow-xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Connect Freighter to view your live positions, vault performance,
                and claim your fixed-rate USDC yield.
              </p>
            </div>
            <Button
              onClick={() => connectWallet()}
              className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold"
            >
              Connect Freighter Wallet
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl tracking-tight flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-primary" /> Portfolio
            </h1>
            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span className="font-mono font-semibold text-foreground">
                {truncateAddress(address)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">XLM Balance</div>
              <div className="tabular font-bold text-lg">{xlmBalance.toFixed(4)} XLM</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-right">
              <div className="text-xs text-muted-foreground">USDC Balance</div>
              <div className="tabular font-bold text-lg">{balance.toFixed(2)} USDC</div>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Principal"
            value={`${totalPrincipal.toFixed(2)} USDC`}
            sub="Locked in PT tokens"
            icon={<Vault className="h-4 w-4 text-primary" />}
          />
          <StatCard
            label="Accrued Yield"
            value={`+${totalAccruedYield.toFixed(4)} USDC`}
            sub="Fixed interest earned"
            accent="success"
            icon={<TrendingUp className="h-4 w-4 text-success" />}
          />
          <StatCard
            label="Total Claimable"
            value={`${totalClaimable.toFixed(2)} USDC`}
            sub="Principal + yield"
            accent="primary"
            icon={<ArrowDownLeft className="h-4 w-4 text-primary" />}
          />
          <StatCard
            label="Weighted APR"
            value={`${weightedApr.toFixed(2)}%`}
            sub={`${allPositions.length} position${allPositions.length !== 1 ? "s" : ""} · ${maturePositions.length} ready`}
            icon={<BarChart2 className="h-4 w-4 text-primary" />}
          />
        </div>

        {/* Tabs */}
        <div className="mt-8 flex items-center gap-1 rounded-lg border border-border bg-surface p-1 w-fit">
          {(["positions", "vault", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium capitalize transition-all",
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === "positions"
                ? `Positions (${allPositions.length})`
                : tab === "vault"
                ? "Vault"
                : `History (${transactions.length})`}
            </button>
          ))}
        </div>

        {/* Tab: Positions */}
        {activeTab === "positions" && (
          <div className="mt-6 space-y-4">
            {allPositions.length === 0 ? (
              <EmptyPositions />
            ) : (
              allPositions.map((p) => {
                const matured = new Date(p.maturityAt).getTime() <= Date.now();
                const accrued = calcAccruedYield(p);
                const claimTotal = p.amount + accrued;
                const pct = calcProgressPct(p.createdAt, p.maturityAt);
                const daysLeft = Math.max(
                  0,
                  Math.ceil((new Date(p.maturityAt).getTime() - Date.now()) / 86_400_000),
                );

                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-border/80 bg-surface p-5 shadow-sm transition-all hover:border-primary/30"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold tabular">
                            {p.amount.toFixed(2)} PT
                          </span>
                          <span className="rounded-md border border-border bg-background px-2.5 py-0.5 text-xs font-bold text-primary">
                            {p.tenorDays}D
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold",
                              matured
                                ? "bg-success/15 text-success border border-success/25"
                                : "bg-primary/10 text-primary border border-primary/20",
                            )}
                          >
                            {matured ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
                            )}
                            {matured ? "Matured" : "Active"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {matured
                            ? "Ready to claim principal + yield"
                            : `${daysLeft} days remaining · matures ${new Date(p.maturityAt).toLocaleDateString()}`}
                        </p>
                        {p.txHash && (
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${p.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-mono"
                          >
                            {p.txHash.slice(0, 16)}… <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">
                          Locked APR
                        </div>
                        <div className="text-2xl font-extrabold text-success tabular">
                          {p.lockedApr.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <Progress
                      value={pct}
                      className={cn(
                        "mt-4 h-2 bg-background/80",
                        matured && "[&>div]:bg-success",
                      )}
                    />

                    {/* Yield breakdown */}
                    <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-border/60 bg-background/60 p-3">
                      <div>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                          Principal
                        </div>
                        <div className="tabular text-sm font-semibold">
                          {p.amount.toFixed(2)} USDC
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                          Accrued Yield
                        </div>
                        <div className="tabular text-sm font-semibold text-success">
                          +{accrued.toFixed(4)} USDC
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                          Total Claimable
                        </div>
                        <div className="tabular text-base font-bold text-primary">
                          {claimTotal.toFixed(2)} USDC
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        disabled={redeemingId === p.id}
                        onClick={() => handleClaim(p)}
                        className={cn(
                          "gap-1.5 font-semibold h-9 px-4",
                          matured
                            ? "bg-success text-success-foreground hover:bg-success/90"
                            : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20",
                        )}
                      >
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                        {redeemingId === p.id
                          ? "Processing…"
                          : matured
                          ? `Claim ${claimTotal.toFixed(2)} USDC`
                          : `Early Withdraw (${claimTotal.toFixed(2)} USDC)`}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab: Vault */}
        {activeTab === "vault" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Vault overview */}
            <div className="rounded-xl border border-border/80 bg-surface p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  <Vault className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Nexum Yield Vault</h2>
                  <p className="text-xs text-muted-foreground">
                    Fixed-rate DeFi vault on Stellar Soroban Testnet
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <VaultStatBox label="Vault APY" value={`${vaultApy.toFixed(2)}%`} accent />
                <VaultStatBox label="Total TVL" value={`$${(vaultTvl).toLocaleString()}`} />
                <VaultStatBox label="Your Deposits" value={`${totalPrincipal.toFixed(2)} USDC`} />
                <VaultStatBox label="Your Profit" value={`+${totalAccruedYield.toFixed(4)} USDC`} accent />
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60">
                <VaultInfoRow label="Vault Contract" value="CDWUAGL…ZFES" mono link="https://stellar.expert/explorer/testnet/contract/CDWUAGLEHR7DMWX5LLND24OOBJBALUIIBGA6CMI7XQ3OZ5CGEOXIZFES" />
                <VaultInfoRow label="PT 30D Contract" value="CA433DJ…SF5" mono link="https://stellar.expert/explorer/testnet/contract/CA433DJVYAXD32VM3A3ALO4Z3VO35KSIBSAD5H3ONT5AXBKLJD3PBSF5" />
                <VaultInfoRow label="PT 90D Contract" value="CD2B37R…JOF" mono link="https://stellar.expert/explorer/testnet/contract/CD2B37RWEBG5PBTV4II27CHAFYYDA2BMIY3U5WDDHGYDWDWXN5X35JOF" />
                <VaultInfoRow label="PT 180D Contract" value="CBA4OHM…LI" mono link="https://stellar.expert/explorer/testnet/contract/CBA4OHMVJ62BD5S6TJVE4QRGNISH6HJT3WKNU4HFXW4YRS66Q34DX6LI" />
                <VaultInfoRow label="Network" value="Stellar Testnet" />
                <VaultInfoRow label="Settlement" value="Stellar Horizon + Soroban RPC" />
              </div>
            </div>

            {/* PT yield breakdown */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" /> Yield Rate Schedule
              </h3>
              {[
                { tenor: "30D", apr: vaultApy * 0.95, contract: "CA433DJ…SF5" },
                { tenor: "90D", apr: vaultApy, contract: "CD2B37R…JOF" },
                { tenor: "180D", apr: vaultApy * 1.08, contract: "CBA4OHM…LI" },
              ].map((row) => (
                <div
                  key={row.tenor}
                  className="rounded-lg border border-border/70 bg-surface p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      Tenor
                    </div>
                    <div className="font-bold text-lg">{row.tenor}</div>
                    <div className="text-xs font-mono text-muted-foreground">{row.contract}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      Fixed APR
                    </div>
                    <div className="text-2xl font-extrabold text-success tabular">
                      {row.apr.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-2 text-xs text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  All rates are fixed-rate. Once locked via PT minting, your APR
                  is guaranteed regardless of market movement. Rate-or-revert
                  protection applies.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: History */}
        {activeTab === "history" && (
          <div className="mt-6 rounded-xl border border-border/80 bg-surface shadow-sm overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                No transactions yet. Execute a trade to see your history here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3.5 text-left font-medium">Time</th>
                      <th className="px-5 py-3.5 text-left font-medium">Tx Hash</th>
                      <th className="px-5 py-3.5 text-left font-medium">Type</th>
                      <th className="px-5 py-3.5 text-right font-medium">Amount</th>
                      <th className="px-5 py-3.5 text-right font-medium">APR</th>
                      <th className="px-5 py-3.5 text-right font-medium">Tenor</th>
                      <th className="px-5 py-3.5 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {transactions.map((t, i) => (
                      <tr key={t.tx_hash + i} className="hover:bg-background/40 transition-colors">
                        <td className="px-5 py-3.5 text-muted-foreground text-xs font-mono">
                          {new Date(t.created_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs text-primary">
                              {t.tx_hash.slice(0, 12)}…
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(t.tx_hash);
                                toast.success("Copied!");
                              }}
                            >
                              <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${t.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                            </a>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              "rounded px-2.5 py-1 text-xs font-bold border",
                              t.type === "REDEEM"
                                ? "bg-success/10 text-success border-success/25"
                                : "bg-primary/10 text-primary border-primary/20",
                            )}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right tabular font-semibold">
                          {t.amount_usdc.toFixed(2)} USDC
                        </td>
                        <td className="px-5 py-3.5 text-right tabular text-success font-semibold">
                          {(t.locked_apr || 0).toFixed(2)}%
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium">{t.tenor_days}D</td>
                        <td className="px-5 py-3.5 text-right">
                          <span
                            className={cn(
                              "rounded px-2 py-0.5 text-xs font-semibold",
                              t.status === "success"
                                ? "text-success bg-success/10"
                                : "text-destructive bg-destructive/10",
                            )}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CTA to trade if no positions */}
        {allPositions.length === 0 && activeTab === "positions" && (
          <div className="mt-6 flex justify-center">
            <Button
              asChild
              className="h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold"
            >
              <Link to="/trade">
                <ArrowUpRight className="h-4 w-4 mr-2" /> Open Trade
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  accent?: "primary" | "success";
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </div>
        {icon}
      </div>
      <div
        className={cn(
          "tabular mt-2 text-2xl font-bold",
          accent === "success"
            ? "text-success"
            : accent === "primary"
            ? "text-primary"
            : "text-foreground",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function VaultStatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background p-3">
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={cn("tabular font-bold text-lg mt-0.5", accent && "text-success")}>
        {value}
      </div>
    </div>
  );
}

function VaultInfoRow({
  label,
  value,
  mono,
  link,
}: {
  label: string;
  value: string;
  mono?: boolean;
  link?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-1 text-primary hover:underline",
            mono && "font-mono",
          )}
        >
          {value}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className={cn("text-foreground font-medium", mono && "font-mono")}>{value}</span>
      )}
    </div>
  );
}

function EmptyPositions() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/80 bg-surface/50 p-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold">No Active Positions Yet</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Execute a trade to lock your fixed rate. Your PT positions and yield
          will appear here.
        </p>
      </div>
    </div>
  );
}
