import type { Position } from "@/store/walletStore";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, Sparkles, CheckCircle2 } from "lucide-react";

interface Props {
  position: Position;
  onRedeem?: (id: string) => void;
  isRedeeming?: boolean;
}

export function PositionCard({ position, onRedeem, isRedeeming }: Props) {
  const now = Date.now();
  const start = new Date(position.createdAt).getTime();
  const end = new Date(position.maturityAt).getTime();
  const total = Math.max(1, end - start);
  const elapsed = Math.max(0, Math.min(total, now - start));
  const pct = (elapsed / total) * 100;
  const matured = now >= end;
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

  // Calculate Marginable USDC Yield accrued to date
  const elapsedDays = Math.max(0, (now - start) / (1000 * 60 * 60 * 24));
  const accruedYieldUsdc = position.amount * (position.lockedApr / 100) * (Math.min(position.tenorDays, elapsedDays) / 365);
  const totalClaimableUsdc = position.amount + accruedYieldUsdc;

  const maturityLabel = new Date(position.maturityAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-xl border border-border/80 bg-surface p-5 shadow-lg transition-all hover:border-primary/40">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="tabular text-xl font-bold text-foreground">
              {position.amount.toFixed(2)} PT Token
            </span>
            <span className="rounded-md border border-border bg-background px-2.5 py-0.5 text-xs font-semibold text-primary">
              {position.tenorDays}D Fixed Tenor
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Matures {maturityLabel} · {matured ? "Matured — Claim Full Principal + Yield" : `${daysLeft} days remaining`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Locked APR</div>
          <div className="tabular text-2xl font-extrabold text-success">
            {position.lockedApr.toFixed(2)}%
          </div>
        </div>
      </div>

      <Progress
        value={pct}
        className={cn("mt-4 h-2 bg-background/80", matured && "[&>div]:bg-success")}
      />

      <div className="mt-5 grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-background/60 p-3 text-xs">
        <div>
          <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">Accrued Yield</span>
          <span className="font-semibold tabular text-success">+{accruedYieldUsdc.toFixed(4)} USDC</span>
        </div>
        <div className="text-right">
          <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">Marginable Redeemable</span>
          <span className="font-bold tabular text-primary text-sm">{totalClaimableUsdc.toFixed(2)} USDC</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold",
            matured
              ? "bg-success/15 text-success border border-success/30"
              : "bg-primary/15 text-primary border border-primary/30",
          )}
        >
          {matured ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
          {matured ? "Matured & Ready" : "Earning Fixed Interest"}
        </span>

        <Button
          size="sm"
          disabled={isRedeeming}
          onClick={() => onRedeem?.(position.id)}
          className={cn(
            "font-semibold text-xs h-9 px-4 gap-1.5 transition-all shadow-md",
            matured
              ? "bg-success text-success-foreground hover:bg-success/90 glow-success"
              : "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary",
          )}
        >
          <ArrowDownLeft className="h-3.5 w-3.5" />
          {isRedeeming ? "Processing on Soroban..." : `Claim ${totalClaimableUsdc.toFixed(2)} USDC`}
        </Button>
      </div>
    </div>
  );
}
