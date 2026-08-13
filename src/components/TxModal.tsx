import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, CheckCircle2, Copy, Loader2, XCircle } from "lucide-react";

export interface TxSummary {
  amount: number;
  apr: number;
  tenorDays: number;
  maturityAt: string;
}

export type TxState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; hash: string; summary?: TxSummary }
  | { status: "error"; message: string };

interface Props {
  state: TxState;
  onClose: () => void;
  onRetry?: () => void;
}

export function TxModal({ state, onClose, onRetry }: Props) {
  const [copied, setCopied] = useState(false);
  const open = state.status !== "idle";

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (!v && state.status !== "pending" ? onClose() : null)}
    >
      <DialogContent
        className="bg-surface border-border max-w-[calc(100vw-2rem)] sm:max-w-md p-4 sm:p-6 overflow-hidden"
        onInteractOutside={(e) => state.status === "pending" && e.preventDefault()}
        onEscapeKeyDown={(e) => state.status === "pending" && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {state.status === "pending" && "Submitting intent"}
            {state.status === "success" && "Intent executed"}
            {state.status === "error" && "Transaction failed"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4 text-center">
          {state.status === "pending" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Broadcasting to Stellar. This usually takes a few seconds.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Quote is locked — don't close this window.
              </p>
            </>
          )}

          {state.status === "success" && (
            <>
              <CheckCircle2 className="h-14 w-14 text-success" />
              <p className="text-base font-medium text-foreground">Your rate is locked.</p>

              {state.summary && (
                <dl className="w-full space-y-3 rounded-lg border border-border/60 bg-background/80 p-4 text-left">
                  <Row label="Principal" value={`${state.summary.amount.toFixed(2)} USDC`} />
                  <Row
                    label="Locked APR"
                    value={`${state.summary.apr.toFixed(2)}%`}
                    accent
                  />
                  <Row label="Tenor" value={`${state.summary.tenorDays} days`} />
                  <Row
                    label="Maturity"
                    value={new Date(state.summary.maturityAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  />
                </dl>
              )}

              <button
                onClick={() => copyHash(state.hash)}
                className="group flex w-full items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/90 px-3.5 py-2.5 text-left transition-all hover:border-primary/50 hover:bg-background"
                title="Click to copy full transaction hash"
              >
                <span className="block min-w-0 flex-1 truncate font-mono text-xs leading-normal text-foreground/80 group-hover:text-foreground">
                  {state.hash.length > 24
                    ? `${state.hash.slice(0, 14)}...${state.hash.slice(-10)}`
                    : state.hash}
                </span>
                <span className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground group-hover:text-primary">
                  {copied ? (
                    <>
                      <span className="text-success font-sans font-medium text-[11px]">Copied!</span>
                      <Check className="h-4 w-4 text-success" />
                    </>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </span>
              </button>

              <div className="mt-2 flex w-full gap-3">
                <Button asChild variant="outline" className="flex-1 border-border hover:border-primary/50">
                  <Link to="/portfolio" onClick={onClose}>
                    View position
                  </Link>
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Done
                </Button>
              </div>
            </>
          )}

          {state.status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-sm text-muted-foreground">{state.message}</p>
              <div className="mt-2 flex w-full gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1 border-border">
                  Close
                </Button>
                {onRetry && (
                  <Button
                    onClick={onRetry}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Retry
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground/90">{label}</dt>
      <dd className={`font-medium tabular ${accent ? "text-success text-base" : "text-foreground"}`}>
        {value}
      </dd>
    </div>
  );
}
