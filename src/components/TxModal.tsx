import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export type TxState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; hash: string }
  | { status: "error"; message: string };

interface Props {
  state: TxState;
  onClose: () => void;
  onRetry?: () => void;
}

export function TxModal({ state, onClose, onRetry }: Props) {
  const open = state.status !== "idle";
  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="bg-surface border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {state.status === "pending" && "Submitting intent"}
            {state.status === "success" && "Intent executed"}
            {state.status === "error" && "Transaction failed"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-6 text-center">
          {state.status === "pending" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Broadcasting to Stellar. This usually takes a few seconds.
              </p>
            </>
          )}
          {state.status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Your rate is locked.</p>
                <p className="mt-2 font-mono text-xs text-foreground/70 break-all">
                  tx: {state.hash}
                </p>
              </div>
              <Button onClick={onClose} className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Done
              </Button>
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
                  <Button onClick={onRetry} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
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
