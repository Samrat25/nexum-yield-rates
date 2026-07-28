import { create } from "zustand";
import { mockConnectWallet } from "@/lib/stellar";
import { analytics } from "@/lib/analytics";

export interface Position {
  id: string;
  amount: number;
  tenorDays: number;
  lockedApr: number;
  createdAt: string;   // ISO
  maturityAt: string;  // ISO
}

interface WalletState {
  isConnected: boolean;
  address: string;
  balance: number;
  connecting: boolean;
  positions: Position[];
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  addPosition: (p: Omit<Position, "id" | "createdAt">) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  isConnected: false,
  address: "",
  balance: 0,
  connecting: false,
  positions: [],
  connectWallet: async () => {
    if (get().connecting || get().isConnected) return;
    set({ connecting: true });
    try {
      const { address, balance } = await mockConnectWallet();
      set({ isConnected: true, address, balance, connecting: false });
      analytics.track("wallet_connected", { address });
    } catch {
      set({ connecting: false });
    }
  },
  disconnectWallet: () =>
    set({ isConnected: false, address: "", balance: 0, positions: [] }),
  addPosition: (p) =>
    set((s) => ({
      positions: [
        {
          ...p,
          id: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        },
        ...s.positions,
      ],
    })),
}));
