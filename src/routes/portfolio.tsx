/**
 * portfolio.tsx
 *
 * Full portfolio page:
 *  • Active Positions tab  — live yield accrual, progress bars, per-position withdraw
 *  • Vault tab             — on-chain stats, PT rate schedule, contract links
 *  • History tab           — ALL transactions including past, with status badges
 *  • Real tx lifecycle     — Pending → Success → balance refresh
 *  • Active vs Closed      — CLOSED positions filtered from Active, kept in History
 */

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { useWalletStore } from "@/store/walletStore";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { truncateAddress } from "@/lib/mockData";
import { getVaultAPY, getVaultTVL, GAS_RESERVE_XLM } from "@/lib/stellar";
import {
  dbGetPositions,
  dbGetTransactions,
  type DbPosition,
  type DbTransaction,
} from "@/lib/supabase";
import { WithdrawModal, type WithdrawTarget } from "@/components/WithdrawModal";
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
  RefreshCw,
  Archive,
  Zap,
  Activity,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAccruedYield(p: {
  amount: number;
  lockedApr: number;
  createdAt: string;
  tenorDays: number;
}): number {
  const elapsedMs = Date.now() - new Date(p.createdAt).getTime();
  const elapsedDays = Math.max(0, elapsedMs / 86_400_000);
  const cappedDays = Math.min(elapsedDays, p.tenorDays);
  return p.amount * (p.lockedApr / 100) * (cappedDays / 365);
}

function calcProgressPct(createdAt: string, maturityAt: string): number {
  const start = new Date(createdAt).getTime();
  const end = new Date(maturityAt).getTime();
  const now = Date.now();
  const total = Math.max(1, end - start);
  const elapsed = Math.max(0, Math.min(total, now - start));
  return (elapsed / total) * 100;
}

// ─── Normalized position for UI ───────────────────────────────────────────────
interface UIPosition {
  id: string;
  amount: number;          // original PT/principal
  withdrawnAmount: number; // cumulative withdrawn
  tenorDays: number;
  lockedApr: number;
  createdAt: string;
  maturityAt: string;
  txHash: string;
  status: DbPosition["status"];
}

// ─── Page component ───────────────────────────────────────────────────────────
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
  const [vaultTvl, setVaultTvl] = useState(125_000);
  const [activeTab, setActiveTab] = useState<"positions" | "vault" | "history">("positions");
  const [withdrawTarget, setWithdrawTarget] = useState<WithdrawTarget | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tick every 10 s to update live yield
  const [tick, setTick] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    tickRef.current = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  const reload = useCallback(async () => {
    if (!address) return;
    setIsRefreshing(true);
    await refreshBalances();
    const [pos, txs] = await Promise.all([
      dbGetPositions(address),
      dbGetTransactions(address),
    ]);
    setDbPositions(pos);
    setTransactions(txs);
    setIsRefreshing(false);
  }, [address, refreshBalances]);

  useEffect(() => {
    getVaultAPY().then((v) => { if (v > 0) setVaultApy(v); });
    getVaultTVL().then((v) => { if (v > 0) setVaultTvl(v); });
  }, []);

  useEffect(() => {
    if (address) reload();
  }, [address, storePositions, reload]);

  // ── Build unified positions list ─────────────────────────────────────────────
  const allPositions: UIPosition[] = useMemo(() => {
    if (dbPositions.length > 0) {
      return dbPositions.map((p) => ({
        id: p.tx_hash || p.id || `db-${Math.random()}`,
        amount: p.pt_amount,
        withdrawnAmount: p.withdrawn_amount ?? 0,
        tenorDays: p.tenor_days,
        lockedApr: p.locked_apr,
        createdAt: p.created_at,
        maturityAt: p.maturity_at,
        txHash: p.tx_hash,
        status: p.status,
      }));
    }
    return storePositions.map((p) => ({
      id: p.id,
      amount: p.amount,
      withdrawnAmount: 0,
      tenorDays: p.tenorDays,
      lockedApr: p.lockedApr,
      createdAt: p.createdAt,
      maturityAt: p.maturityAt,
      txHash: "",
      status: "active" as const,
    }));
  }, [dbPositions, storePositions, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  // Split active vs closed
  const activePositions = allPositions.filter(
    (p) => p.status === "active" || p.status === "partial",
  );
  const closedPositions = allPositions.filter(
    (p) => p.status === "redeemed" || p.status === "matured",
  );

  // ── Summary stats ────────────────────────────────────────────────────────────
  const totalPrincipal = activePositions.reduce(
    (s, p) => s + Math.max(0, p.amount - p.withdrawnAmount),
    0,
  );
  const totalAccruedYield = activePositions.reduce(
    (s, p) => s + calcAccruedYield({ ...p, amount: Math.max(0, p.amount - p.withdrawnAmount) }),
    0,
  );
  const totalClaimable = totalPrincipal + totalAccruedYield;
  const weightedApr =
    totalPrincipal > 0
      ? activePositions.reduce((s, p) => s + p.lockedApr * Math.max(0, p.amount - p.withdrawnAmount), 0) /
        totalPrincipal
      : 0;

  // ── Withdraw success handler ──────────────────────────────────────────────────
  const handleWithdrawSuccess = useCallback(
    async (withdrawnAmount: number, isFull: boolean, netReceived: number, txHash: string) => {
      toast.success(
        `✅ ${netReceived.toFixed(4)} USDC ${isFull ? "fully claimed" : "partially withdrawn"} · tx: ${txHash.slice(0, 10)}…`,
      );
      setWithdrawTarget(null);
      await reload();
    },
    [reload],
  );

  // ── Wallet not connected guard ────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-24">
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-16 text-center shadow-xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Connect Freighter to view live positions, vault metrics, and claim
                your fixed-rate USDC yield.
              </p>
            </div>
            <Button
              onClick={connectWallet}
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
      <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl tracking-tight">
              <TrendingUp className="h-7 w-7 text-primary" /> Portfolio
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span className="font-mono font-semibold text-foreground">
                {truncateAddress(address)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">XLM Balance</div>
              <div className="tabular font-bold text-lg">{xlmBalance.toFixed(4)} XLM</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-right">
              <div className="text-xs text-muted-foreground">USDC Balance</div>
              <div className="tabular font-bold text-lg">{balance.toFixed(2)} USDC</div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 border-border"
              onClick={reload}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active Principal"
            value={`${totalPrincipal.toFixed(2)} USDC`}
            sub={`${activePositions.length} active position${activePositions.length !== 1 ? "s" : ""}`}
            icon={<Vault className="h-4 w-4 text-primary" />}
          />
          <StatCard
            label="Live Accrued Yield"
            value={`+${totalAccruedYield.toFixed(4)} USDC`}
            sub="Updates every 10 seconds"
            accent="success"
            icon={<Activity className="h-4 w-4 text-success" />}
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
            sub={`${closedPositions.length} archived`}
            icon={<BarChart2 className="h-4 w-4 text-primary" />}
          />
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1 w-fit">
          {([
            ["positions", `Active (${activePositions.length})`],
            ["vault", "Vault"],
            ["history", `History (${transactions.length + closedPositions.length})`],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Active Positions tab ── */}
        {activeTab === "positions" && (
          <div className="space-y-4">
            {activePositions.length === 0 ? (
              <EmptyState />
            ) : (
              activePositions.map((p) => {
                const remainingPrincipal = Math.max(0, p.amount - p.withdrawnAmount);
                const accrued = calcAccruedYield({
                  ...p,
                  amount: remainingPrincipal,
                });
                const claimTotal = remainingPrincipal + accrued;
                const pct = calcProgressPct(p.createdAt, p.maturityAt);
                const matured = new Date(p.maturityAt).getTime() <= Date.now();
                const daysLeft = Math.max(
                  0,
                  Math.ceil((new Date(p.maturityAt).getTime() - Date.now()) / 86_400_000),
                );

                return (
                  <PositionCard
                    key={p.id}
                    position={p}
                    remainingPrincipal={remainingPrincipal}
                    accrued={accrued}
                    claimTotal={claimTotal}
                    pct={pct}
                    matured={matured}
                    daysLeft={daysLeft}
                    onWithdraw={() =>
                      setWithdrawTarget({
                        txHash: p.txHash || p.id,
                        principal: p.amount,
                        withdrawnSoFar: p.withdrawnAmount,
                        accruedYield: accrued,
                        lockedApr: p.lockedApr,
                        tenorDays: p.tenorDays,
                        isMature: matured,
                      })
                    }
                  />
                );
              })
            )}

            {activePositions.length === 0 && (
              <div className="flex justify-center pt-2">
                <Button asChild className="h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold">
                  <Link to="/trade">
                    <ArrowUpRight className="h-4 w-4 mr-2" /> Open New Trade
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Vault tab ── */}
        {activeTab === "vault" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-surface p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  <Vault className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Nexum Yield Vault</h2>
                  <p className="text-xs text-muted-foreground">
                    Fixed-rate DeFi vault · Stellar Soroban Testnet
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <VaultStat label="Vault APY" value={`${vaultApy.toFixed(2)}%`} accent />
                <VaultStat label="Total TVL" value={`$${vaultTvl.toLocaleString()}`} />
                <VaultStat label="Your Deposits" value={`${totalPrincipal.toFixed(2)} USDC`} />
                <VaultStat label="Your Profit" value={`+${totalAccruedYield.toFixed(4)} USDC`} accent />
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60">
                {[
                  ["Vault Contract", "CDWUAGL…ZFES", "https://stellar.expert/explorer/testnet/contract/CDWUAGLEHR7DMWX5LLND24OOBJBALUIIBGA6CMI7XQ3OZ5CGEOXIZFES"],
                  ["PT 30D", "CA433DJ…SF5", "https://stellar.expert/explorer/testnet/contract/CA433DJVYAXD32VM3A3ALO4Z3VO35KSIBSAD5H3ONT5AXBKLJD3PBSF5"],
                  ["PT 90D", "CD2B37R…JOF", "https://stellar.expert/explorer/testnet/contract/CD2B37RWEBG5PBTV4II27CHAFYYDA2BMIY3U5WDDHGYDWDWXN5X35JOF"],
                  ["PT 180D", "CBA4OHM…LI", "https://stellar.expert/explorer/testnet/contract/CBA4OHMVJ62BD5S6TJVE4QRGNISH6HJT3WKNU4HFXW4YRS66Q34DX6LI"],
                ].map(([label, val, link]) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-mono text-primary hover:underline">
                      {val} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-medium">Stellar Testnet</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" /> Rate Schedule
              </h3>
              {[
                { tenor: "30D", apr: vaultApy * 0.95 },
                { tenor: "90D", apr: vaultApy },
                { tenor: "180D", apr: vaultApy * 1.08 },
              ].map((row) => (
                <div key={row.tenor} className="rounded-xl border border-border/70 bg-surface p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Tenor</div>
                    <div className="font-bold text-2xl">{row.tenor}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Fixed APR</div>
                    <div className="text-2xl font-extrabold text-success tabular">{row.apr.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-2 text-xs text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Rate-or-revert guarantee: your APR is locked at execution and cannot change.
                  Early withdrawal incurs a <strong>{0.5}% penalty</strong> on remaining principal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── History tab ── */}
        {activeTab === "history" && (
          <HistoryTab transactions={transactions} closedPositions={closedPositions} />
        )}
      </main>

      {/* ── Withdraw Modal ── */}
      <WithdrawModal
        open={withdrawTarget !== null}
        target={withdrawTarget}
        xlmBalance={xlmBalance}
        userAddress={address}
        signTx={signTx}
        onClose={() => setWithdrawTarget(null)}
        onSuccess={handleWithdrawSuccess}
      />
    </div>
  );
}

// ─── Position card ────────────────────────────────────────────────────────────

function PositionCard({
  position: p,
  remainingPrincipal,
  accrued,
  claimTotal,
  pct,
  matured,
  daysLeft,
  onWithdraw,
}: {
  position: UIPosition;
  remainingPrincipal: number;
  accrued: number;
  claimTotal: number;
  pct: number;
  matured: boolean;
  daysLeft: number;
  onWithdraw: () => void;
}) {
  const isPartial = p.withdrawnAmount > 0 && !matured;

  return (
    <div className="rounded-xl border border-border/80 bg-surface p-5 shadow-sm transition-all hover:border-primary/30">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-bold tabular">{remainingPrincipal.toFixed(2)} PT</span>
            <span className="rounded-md border border-border bg-background px-2.5 py-0.5 text-xs font-bold text-primary">
              {p.tenorDays}D
            </span>
            <StatusBadge matured={matured} isPartial={isPartial} />
          </div>
          <p className="text-xs text-muted-foreground">
            {matured
              ? "Matured — ready to claim principal + full yield"
              : `${daysLeft}d remaining · matures ${new Date(p.maturityAt).toLocaleDateString()}`}
          </p>
          {isPartial && (
            <p className="text-xs text-amber-400 font-medium">
              ↳ {p.withdrawnAmount.toFixed(4)} USDC already withdrawn
            </p>
          )}
          {p.txHash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${p.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline"
            >
              {p.txHash.slice(0, 16)}… <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="text-right">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Locked APR</div>
          <div className="text-2xl font-extrabold text-success tabular">
            {p.lockedApr.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <Progress
        value={pct}
        className={cn("mt-4 h-2 bg-background/80", matured && "[&>div]:bg-success")}
      />

      {/* Yield breakdown */}
      <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
        <div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Principal</div>
          <div className="tabular text-sm font-semibold">{remainingPrincipal.toFixed(2)} USDC</div>
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Live Yield</div>
          <div className="tabular text-sm font-semibold text-success">+{accrued.toFixed(4)}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Claimable</div>
          <div className="tabular text-base font-bold text-primary">{claimTotal.toFixed(2)} USDC</div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onWithdraw}
          className="gap-1.5 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground h-9"
        >
          <Clock className="h-3.5 w-3.5" />
          Early Withdraw
        </Button>
        <Button
          size="sm"
          onClick={onWithdraw}
          className={cn(
            "gap-1.5 font-semibold h-9 px-5",
            matured
              ? "bg-success text-success-foreground hover:bg-success/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          <ArrowDownLeft className="h-3.5 w-3.5" />
          {matured ? `Claim ${claimTotal.toFixed(2)} USDC` : `Withdraw`}
        </Button>
      </div>
    </div>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────────

function HistoryTab({
  transactions,
  closedPositions,
}: {
  transactions: DbTransaction[];
  closedPositions: UIPosition[];
}) {
  return (
    <div className="space-y-4">
      {/* Archived positions */}
      {closedPositions.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Archive className="h-4 w-4" /> Archived Positions
          </h3>
          <div className="space-y-2">
            {closedPositions.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-surface/60 p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular">{p.amount.toFixed(2)} PT</span>
                    <span className="rounded-md bg-border/40 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                      {p.tenorDays}D
                    </span>
                    <span className="rounded-md bg-muted/20 px-2 py-0.5 text-[11px] text-muted-foreground">
                      CLOSED
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(p.createdAt).toLocaleDateString()} · APR {p.lockedApr.toFixed(2)}%
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  Withdrawn: {p.withdrawnAmount.toFixed(4)} USDC
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction log */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Zap className="h-4 w-4" /> Transaction Log
        </h3>
        <div className="rounded-xl border border-border/80 bg-surface shadow-sm overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No transactions yet. Execute a trade to see history here.
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
                    <th className="px-5 py-3.5 text-right font-medium">Net Received</th>
                    <th className="px-5 py-3.5 text-right font-medium">APR</th>
                    <th className="px-5 py-3.5 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {transactions.map((t, i) => (
                    <tr key={t.tx_hash + i} className="hover:bg-background/40 transition-colors">
                      <td className="px-5 py-3.5 text-muted-foreground text-xs font-mono whitespace-nowrap">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-primary">{t.tx_hash.slice(0, 12)}…</span>
                          <button onClick={() => { navigator.clipboard.writeText(t.tx_hash); toast.success("Copied!"); }}>
                            <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </button>
                          <a href={`https://stellar.expert/explorer/testnet/tx/${t.tx_hash}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                          </a>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <TypeBadge type={t.type} />
                      </td>
                      <td className="px-5 py-3.5 text-right tabular font-semibold">
                        {t.amount_usdc.toFixed(2)} USDC
                      </td>
                      <td className="px-5 py-3.5 text-right tabular text-success font-semibold">
                        {t.net_received != null ? `${t.net_received.toFixed(4)} USDC` : "—"}
                        {t.penalty_amount && t.penalty_amount > 0 ? (
                          <span className="ml-1 text-xs text-destructive">(-{t.penalty_amount.toFixed(4)})</span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular text-success font-semibold">
                        {(t.locked_apr || 0).toFixed(2)}%
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <StatusChip status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Small reusable UI pieces ─────────────────────────────────────────────────

function StatusBadge({ matured, isPartial }: { matured: boolean; isPartial: boolean }) {
  if (matured)
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-success/15 border border-success/25 px-2 py-0.5 text-xs font-semibold text-success">
        <CheckCircle2 className="h-3 w-3" /> Matured
      </span>
    );
  if (isPartial)
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-xs font-semibold text-amber-400">
        <Clock className="h-3 w-3" /> Partial
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Active
    </span>
  );
}

function TypeBadge({ type }: { type: DbTransaction["type"] }) {
  const styles: Record<string, string> = {
    MINT_INTENT: "bg-primary/10 text-primary border-primary/20",
    SWAP_XLM_MINT: "bg-primary/10 text-primary border-primary/20",
    REDEEM: "bg-success/10 text-success border-success/25",
    EARLY_WITHDRAW: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    PARTIAL_WITHDRAW: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  };
  return (
    <span className={cn("rounded-md border px-2.5 py-1 text-xs font-bold", styles[type] ?? "bg-muted/20 text-muted-foreground border-border")}>
      {type.replace(/_/g, " ")}
    </span>
  );
}

function StatusChip({ status }: { status: DbTransaction["status"] }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold",
      status === "success" ? "text-success bg-success/10" :
      status === "pending" ? "text-amber-400 bg-amber-500/10" :
      "text-destructive bg-destructive/10",
    )}>
      {status === "pending" && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />}
      {status}
    </span>
  );
}

function StatCard({
  label, value, sub, icon, accent,
}: {
  label: string; value: string; sub?: string; icon?: React.ReactNode; accent?: "primary" | "success";
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
        {icon}
      </div>
      <div className={cn(
        "tabular mt-2 text-2xl font-bold",
        accent === "success" ? "text-success" : accent === "primary" ? "text-primary" : "text-foreground",
      )}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function VaultStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-3">
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={cn("tabular font-bold text-lg mt-0.5", accent && "text-success")}>{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/80 bg-surface/50 p-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold">No Active Positions</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Execute a trade to lock your fixed rate. Your positions will appear here with live yield tracking.
        </p>
      </div>
    </div>
  );
}
