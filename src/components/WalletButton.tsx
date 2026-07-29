/**
 * WalletButton.tsx
 *
 * Navbar wallet button. Connects via Freighter (real) or mock wallet (dev).
 * Shows a "MOCK" badge when using the development fallback.
 */
import { useWalletStore } from "@/store/walletStore";
import { truncateAddress } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function WalletButton() {
  const { isConnected, address, balance, connecting, isMock, connectWallet, disconnectWallet } =
    useWalletStore();

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success("Wallet connected");
    } catch (err) {
      toast.error((err as Error).message ?? "Connection failed");
    }
  };

  if (!isConnected) {
    return (
      <Button
        variant="outline"
        onClick={handleConnect}
        disabled={connecting}
        className="border-primary/60 text-primary hover:bg-primary/10 hover:text-primary rounded-md"
      >
        {connecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting…
          </>
        ) : (
          "Connect Wallet"
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm text-foreground/90 hover:bg-accent transition-colors tabular">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-success" />
          {truncateAddress(address)}
          <span className="ml-1 text-muted-foreground">· {balance.toFixed(0)} USDC</span>
          {isMock && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-sm bg-warning/20 px-1 py-0.5 text-[10px] font-medium text-warning">
              <AlertCircle className="h-2.5 w-2.5" /> MOCK
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-surface border-border">
        {isMock && (
          <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
            Install{" "}
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              Freighter
            </a>{" "}
            for real wallet
          </div>
        )}
        <DropdownMenuItem
          onClick={disconnectWallet}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
