import { useWalletStore } from "@/store/walletStore";
import { truncateAddress } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WalletButton() {
  const { isConnected, address, balance, connecting, connectWallet, disconnectWallet } =
    useWalletStore();

  if (!isConnected) {
    return (
      <Button
        variant="outline"
        onClick={() => connectWallet()}
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
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-surface border-border">
        <DropdownMenuItem onClick={disconnectWallet} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
