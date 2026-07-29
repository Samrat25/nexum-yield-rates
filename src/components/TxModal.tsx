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
        className="bg-surface border-border sm:max-w-md"
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
              <CheckCircle2 className="h-12 w-12 text-success" />
              <p className="text-sm text-muted-foreground">Your rate is locked.</p>

              {state.summary && (
                <dl className="w-full space-y-2 rounded-md border border-border bg-background/60 p-3 text-left text-sm">
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
                className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background/60 px-3 py-2 text-left transition-colors hover:border-primary/40"
              >
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground/70">
                  {state.hash}
                </span>
                {copied ? (
                  <Check className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              <div className="mt-1 flex w-full gap-2">
                <Button asChild variant="outline" className="flex-1 border-border">
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
    <div className="flex items-center justify-between">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`tabular font-medium ${accent ? "text-success" : ""}`}>{value}</dd>
    </div>
  );
}
