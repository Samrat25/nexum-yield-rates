import { Loader2 } from "lucide-react";
import type { Quote } from "@/lib/stellar";
import { cn } from "@/lib/utils";

interface Props {
  quote: Quote;
  targetApr: number;
  amount: number;
  tick: number;
}

export function QuoteDisplay({ quote, targetApr, amount }: Props) {
  const achievable = quote.impliedApr >= targetApr;
  const maturity = new Date(quote.maturityDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // rate comparison bar — normalize between 5–30
  const pctTarget = ((targetApr - 5) / 25) * 100;
  const pctImplied = ((quote.impliedApr - 5) / 25) * 100;

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Live Quote</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-success/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Live
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Implied APR</div>
        <div className={cn("tabular text-5xl font-bold mt-1", achievable ? "text-success" : "text-destructive")}>
          {quote.impliedApr.toFixed(2)}
          <span className="text-2xl font-semibold">%</span>
        </div>
      </div>

      <dl className="mt-6 space-y-3 text-sm">
        <Row label="PT Received" value={<span className="tabular">{quote.ptReceived.toFixed(2)} PT</span>} />
        <Row label="Execution cost" value={<span className="tabular">{quote.executionCostUsdc.toFixed(2)} USDC</span>} />
        <Row label="Maturity date" value={maturity} />
        <Row label="Input" value={<span className="tabular">{amount.toFixed(2)} USDC</span>} />
      </dl>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Target vs Implied</span>
          <span className={achievable ? "text-success" : "text-destructive"}>
            {achievable ? "Achievable" : "Below target"}
          </span>
        </div>
        <div className="relative h-2 rounded-full bg-background overflow-hidden">
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full", achievable ? "bg-success" : "bg-destructive")}
            style={{ width: `${Math.min(100, pctImplied)}%` }}
          />
          <div
            className="absolute inset-y-[-4px] w-0.5 bg-foreground/70"
            style={{ left: `${Math.min(100, Math.max(0, pctTarget))}%` }}
            aria-label="Target marker"
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>5%</span>
          <span>30%</span>
        </div>
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Quote updates every 3 seconds. Slippage may occur.
      </p>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-none">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
