import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useWalletStore } from "@/store/walletStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  computeQuote,
  executeMintOnChain,
  getXLMToUSDCRate,
  type Quote,
} from "@/lib/stellar";
import { runLangGraphMarketAnalysis } from "@/lib/marketAgent";
import { dbSavePosition, dbSaveTransaction, dbSaveQuote } from "@/lib/supabase";
import { analytics } from "@/lib/analytics";
import { QuoteDisplay } from "./QuoteDisplay";
import { TxModal, type TxState } from "./TxModal";
import { toast } from "sonner";
import { ArrowLeftRight, Sparkles, Cpu, Info } from "lucide-react";

const TENORS = [30, 90, 180] as const;
type Tenor = (typeof TENORS)[number];
type Asset = "USDC" | "XLM";

export function IntentForm() {
  const {
    isConnected,
    address,
    balance,
    xlmBalance,
    signTx,
    addPosition,
    refreshBalances,
  } = useWalletStore();
  const [asset, setAsset] = useState<Asset>("XLM");
  const [amount, setAmount] = useState("");
  const [tenor, setTenor] = useState<Tenor>(90);
  const [targetApr, setTargetApr] = useState(15);
  const [tick, setTick] = useState(0);
  const [xlmRate, setXlmRate] = useState<number>(0.125);

  const [txState, setTxState] = useState<TxState>({ status: "idle" });
  const pending = txState.status === "pending";

  useEffect(() => {
    getXLMToUSDCRate().then(setXlmRate);
    if (isConnected) refreshBalances();
  }, [isConnected, refreshBalances]);

  useEffect(() => {
    if (pending) return;
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, [pending]);

  const rawAmountNum = Number(amount) || 0;
  const usdcEquivalentAmount =
    asset === "XLM" ? rawAmountNum * xlmRate : rawAmountNum;

  const marketInsight = useMemo(
    () => runLangGraphMarketAnalysis(xlmRate, 15.2, targetApr),
    [xlmRate, targetApr],
  );

  const quote = useMemo(
    () => computeQuote(usdcEquivalentAmount, tenor, targetApr),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usdcEquivalentAmount, tenor, targetApr, tick],
  );

  const quoteRef = useRef<Quote>(quote);
  quoteRef.current = quote;

  useEffect(() => {
    if (usdcEquivalentAmount <= 0) return;
    const timer = setTimeout(() => {
      analytics.track("intent_quoted", {
        amount: usdcEquivalentAmount,
        tenor,
        targetApr,
        asset,
      });
      if (address) {
        dbSaveQuote({
          user_address: address,
          input_asset: asset,
          input_amount: rawAmountNum,
          target_apr: targetApr,
          tenor_days: tenor,
          implied_apr: quote.impliedApr,
          pt_amount: quote.ptReceived,
          achievable: quote.impliedApr >= targetApr,
          created_at: new Date().toISOString(),
        });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [
    usdcEquivalentAmount,
    tenor,
    targetApr,
    asset,
    address,
    rawAmountNum,
    quote.impliedApr,
    quote.ptReceived,
  ]);

  // Keep 1 XLM for gas reserve on XLM trades
  const activeBalance = asset === "USDC" ? balance : Math.max(0, xlmBalance - 1);
  const hasSufficientBalance =
    isConnected && rawAmountNum > 0 && rawAmountNum <= activeBalance;

  const execute = useMutation({
    mutationFn: async () => {
      const lockedQuote = quoteRef.current;
      const lockedUsdcAmount = usdcEquivalentAmount;
      const lockedTenor = tenor;
      setTxState({ status: "pending" });

      if (!isConnected || !address) {
        throw new Error("Please connect your Freighter wallet first.");
      }

      toast.info(
        asset === "XLM"
          ? `Approve sending ${rawAmountNum.toFixed(4)} XLM in Freighter…`
          : `Approve sending ${rawAmountNum.toFixed(2)} USDC in Freighter…`,
      );

      // Real on-chain payment via Horizon — Freighter shows real amount
      const hash = await executeMintOnChain(
        address,
        asset,
        rawAmountNum,
        lockedTenor,
        signTx,
      );

      const executedApr = lockedQuote.impliedApr;
      const ptContractId =
        lockedTenor === 30
          ? import.meta.env.VITE_PT30D_CONTRACT_ID ||
            "CA433DJVYAXD32VM3A3ALO4Z3VO35KSIBSAD5H3ONT5AXBKLJD3PBSF5"
          : lockedTenor === 90
          ? import.meta.env.VITE_PT90D_CONTRACT_ID ||
            "CD2B37RWEBG5PBTV4II27CHAFYYDA2BMIY3U5WDDHGYDWDWXN5X35JOF"
          : import.meta.env.VITE_PT180D_CONTRACT_ID ||
            "CBA4OHMVJ62BD5S6TJVE4QRGNISH6HJT3WKNU4HFXW4YRS66Q34DX6LI";

      if (address) {
        await dbSavePosition({
          user_address: address,
          pt_token_id: ptContractId,
          tenor_days: lockedTenor,
          pt_amount: lockedQuote.ptReceived,
          locked_apr: executedApr,
          tx_hash: hash,
          maturity_at: lockedQuote.maturityDate,
          status: "active",
          created_at: new Date().toISOString(),
        });

        await dbSaveTransaction({
          tx_hash: hash,
          user_address: address,
          type: asset === "XLM" ? "SWAP_XLM_MINT" : "MINT_INTENT",
          amount_usdc: lockedUsdcAmount,
          amount_xlm: asset === "XLM" ? rawAmountNum : undefined,
          pt_amount: lockedQuote.ptReceived,
          locked_apr: executedApr,
          tenor_days: lockedTenor,
          status: "success",
          created_at: new Date().toISOString(),
        });
      }

      await refreshBalances();

      return {
        hash,
        amount: lockedUsdcAmount,
        rawAmount: rawAmountNum,
        assetType: asset,
        tenorDays: lockedTenor,
        executedApr,
        maturityAt: lockedQuote.maturityDate,
        ptReceived: lockedQuote.ptReceived,
      };
    },
    onSuccess: (res) => {
      setTxState({
        status: "success",
        hash: res.hash,
        summary: {
          amount: res.amount,
          apr: res.executedApr,
          tenorDays: res.tenorDays,
          maturityAt: res.maturityAt,
        },
      });
      addPosition({
        amount: res.ptReceived,
        tenorDays: res.tenorDays,
        lockedApr: res.executedApr,
        maturityAt: res.maturityAt,
      });
      analytics.track("intent_executed", {
        amount: res.amount,
        tenor: res.tenorDays,
        lockedApr: res.executedApr,
        txHash: res.hash,
      });
      toast.success(
        `✅ PT tokens minted! Rate locked at ${res.executedApr.toFixed(2)}% APR.`,
      );
      setAmount("");
    },
    onError: (err: Error) => {
      setTxState({ status: "error", message: err.message });
      toast.error(err.message);
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* Left — form */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Configure Yield Intent</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lock your fixed rate. Smart router executes or reverts on-chain.
            </p>
          </div>
          {/* Asset toggle */}
          <div className="flex rounded-lg border border-border bg-background p-1 text-xs shrink-0">
            {(["XLM", "USDC"] as Asset[]).map((a) => (
              <button
                key={a}
                onClick={() => {
                  setAsset(a);
                  setAmount("");
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 font-semibold transition-all flex items-center gap-1",
                  asset === a
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {a === "XLM" && <Sparkles className="h-3 w-3" />}
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {asset === "USDC" ? "USDC Deposit Amount" : "XLM Payment Amount"}
              </Label>
              {asset === "XLM" && (
                <span className="text-xs text-muted-foreground font-mono">
                  1 XLM ≈ {xlmRate.toFixed(4)} USDC
                </span>
              )}
            </div>
            <div className="relative mt-2">
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder={`Enter ${asset} amount…`}
                inputMode="decimal"
                className="h-12 rounded-md border-border bg-background text-lg tabular pr-16"
              />
              <span className="absolute right-4 top-3 text-sm font-semibold text-muted-foreground">
                {asset}
              </span>
            </div>

            {asset === "XLM" && rawAmountNum > 0 && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs text-primary">
                <ArrowLeftRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>{rawAmountNum.toFixed(4)} XLM</strong> deducted from
                  your wallet →{" "}
                  <strong>~{usdcEquivalentAmount.toFixed(2)} USDC</strong>{" "}
                  equivalent PT minted
                </span>
              </div>
            )}

            {asset === "USDC" && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-400">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Requires USDC trustline on your testnet account. Use XLM if
                  you don't have testnet USDC.
                </span>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                On-chain Balance:{" "}
                <span className="tabular font-semibold text-foreground">
                  {isConnected
                    ? asset === "USDC"
                      ? `${balance.toFixed(2)} USDC`
                      : `${xlmBalance.toFixed(2)} XLM`
                    : "—"}
                </span>
              </span>
              {isConnected && activeBalance > 0 && (
                <button
                  onClick={() => setAmount(String(Math.floor(activeBalance * 10000) / 10000))}
                  className="text-primary hover:underline font-medium"
                >
                  Max
                </button>
              )}
            </div>
          </div>

          {/* Tenor */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Tenor Duration
            </Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {TENORS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTenor(t)}
                  className={cn(
                    "h-11 rounded-md border text-sm font-medium transition-all",
                    tenor === t
                      ? "border-primary bg-primary text-primary-foreground glow-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {t} Days
                </button>
              ))}
            </div>
          </div>

          {/* APR slider */}
          <div>
            <div className="flex items-end justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Target Minimum APR
              </Label>
              <span className="tabular text-2xl font-semibold text-primary">
                {targetApr.toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[targetApr]}
              onValueChange={(v) => setTargetApr(v[0])}
              min={5}
              max={30}
              step={0.1}
              className="mt-3"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>5.0%</span>
              <span>30.0%</span>
            </div>
          </div>

          {/* LangGraph AI */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <Cpu className="h-3.5 w-3.5" />
              <span>LangGraph Market Intelligence</span>
              <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.5 text-[10px]">
                {marketInsight.marketRecommendation.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {marketInsight.aiAnalysisSummary}
            </p>
          </div>

          {/* CTA */}
          <Button
            size="lg"
            disabled={!hasSufficientBalance || execute.isPending}
            onClick={() => execute.mutate()}
            className="w-full h-12 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 glow-primary font-semibold"
          >
            {!isConnected
              ? "Connect Wallet to Trade"
              : rawAmountNum <= 0
              ? "Enter Amount"
              : rawAmountNum > activeBalance
              ? `Insufficient ${asset} (have ${activeBalance.toFixed(asset === "USDC" ? 2 : 4)})`
              : execute.isPending
              ? "Sign in Freighter…"
              : `Mint PT · ${asset === "XLM" ? rawAmountNum.toFixed(4) + " XLM" : rawAmountNum.toFixed(2) + " USDC"}`}
          </Button>
        </div>
      </section>

      {/* Right — quote */}
      <QuoteDisplay
        quote={quote}
        targetApr={targetApr}
        amount={usdcEquivalentAmount}
        tick={tick}
      />

      <TxModal
        state={txState}
        onClose={() => {
          setTxState({ status: "idle" });
          execute.reset();
        }}
        onRetry={() => execute.mutate()}
      />
    </div>
  );
}
