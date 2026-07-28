import type { Position } from "@/store/walletStore";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  position: Position;
  onRedeem?: (id: string) => void;
}

export function PositionCard({ position, onRedeem }: Props) {
  const now = Date.now();
  const start = new Date(position.createdAt).getTime();
  const end = new Date(position.maturityAt).getTime();
  const total = Math.max(1, end - start);
  const elapsed = Math.max(0, Math.min(total, now - start));
  const pct = (elapsed / total) * 100;
  const matured = now >= end;
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  const maturityLabel = new Date(position.maturityAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="tabular text-lg font-semibold">
              {position.amount.toFixed(2)} PT
            </span>
            <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
              {position.tenorDays}D
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Matures {maturityLabel} · {matured ? "Ready to redeem" : `${daysLeft} days remaining`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Locked APR</div>
          <div className="tabular text-2xl font-bold text-success">
            {position.lockedApr.toFixed(2)}%
          </div>
        </div>
      </div>

      <Progress
        value={pct}
        className={cn("mt-4 h-1.5 bg-background", matured && "[&>div]:bg-success")}
      />

      <div className="mt-4 flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
            matured
              ? "bg-success/15 text-success"
              : "bg-primary/15 text-primary",
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", matured ? "bg-success" : "bg-primary pulse-dot")} />
          {matured ? "Matured" : "Active"}
        </span>
        {matured && (
          <Button
            size="sm"
            onClick={() => onRedeem?.(position.id)}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            Redeem
          </Button>
        )}
      </div>
    </div>
  );
}
