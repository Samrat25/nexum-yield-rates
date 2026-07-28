import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useWalletStore } from "@/store/walletStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { computeQuote } from "@/lib/stellar";
import { analytics } from "@/lib/analytics";
import { QuoteDisplay } from "./QuoteDisplay";
import { TxModal, type TxState } from "./TxModal";
import { toast } from "sonner";

const TENORS = [30, 90, 180] as const;
type Tenor = (typeof TENORS)[number];

export function IntentForm() {
  const { isConnected, balance, addPosition } = useWalletStore();
  const [amount, setAmount] = useState("");
  const [tenor, setTenor] = useState<Tenor>(90);
  const [targetApr, setTargetApr] = useState(15);
  const [tick, setTick] = useState(0);

  const [txState, setTxState] = useState<TxState>({ status: "idle" });

  // Live quote — recompute every 3s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const amountNum = Number(amount) || 0;
  const quote = useMemo(
    () => computeQuote(amountNum, tenor, targetApr),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [amountNum, tenor, targetApr, tick],
  );

  useEffect(() => {
    if (amountNum > 0) analytics.track("intent_quoted", { amount: amountNum, tenor, targetApr });
  }, [amountNum, tenor, targetApr]);

  const canExecute = isConnected && amountNum > 0 && amountNum <= balance;
  const achievable = quote.impliedApr >= targetApr;

  const execute = useMutation({
    mutationFn: async () => {
      setTxState({ status: "pending" });
      await new Promise((r) => setTimeout(r, 1600));
      if (!achievable) throw new Error("Achieved APR fell below target. Intent reverted.");
      const hash = "0x" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10);
      return { hash };
    },
    onSuccess: ({ hash }) => {
      setTxState({ status: "success", hash });
      addPosition({
        amount: amountNum,
        tenorDays: tenor,
        lockedApr: quote.impliedApr,
        maturityAt: quote.maturityDate,
      });
      analytics.track("intent_executed", {
        amount: amountNum,
        tenor,
        lockedApr: quote.impliedApr,
        txHash: hash,
      });
      toast.success("Intent executed. Rate locked.");
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
        <h2 className="text-lg font-semibold">Configure Intent</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define your rate. If the market can't hit it, nothing executes.
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              USDC Amount
            </Label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="Enter amount..."
              inputMode="decimal"
              className="mt-2 h-12 rounded-md border-border bg-background text-lg tabular"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Balance:{" "}
                <span className="tabular text-foreground/80">
                  {isConnected ? balance.toFixed(2) : "—"} USDC
                </span>
              </span>
              {isConnected && (
                <button
                  onClick={() => setAmount(String(balance))}
                  className="text-primary hover:underline"
                >
                  Max
                </button>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Tenor
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

          <div>
            <div className="flex items-end justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Target APR
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
              <span>5%</span>
              <span>30%</span>
            </div>
          </div>

          <div className="rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Rate or Revert</span> — if achieved APR
            falls below your target, the entire transaction cancels automatically.
          </div>

          <Button
            size="lg"
            disabled={!canExecute || execute.isPending}
            onClick={() => execute.mutate()}
            className="w-full h-12 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 glow-primary"
          >
            {!isConnected
              ? "Connect Wallet to Trade"
              : amountNum <= 0
                ? "Enter an amount"
                : amountNum > balance
                  ? "Insufficient balance"
                  : execute.isPending
                    ? "Executing…"
                    : "Execute Intent"}
          </Button>
        </div>
      </section>

      {/* Right — quote */}
      <QuoteDisplay quote={quote} targetApr={targetApr} amount={amountNum} tick={tick} />

      <TxModal
        state={txState}
        onClose={() => {
          setTxState({ status: "idle" });
          if (execute.isSuccess) setAmount("");
          execute.reset();
        }}
        onRetry={() => execute.mutate()}
      />
    </div>
  );
}
