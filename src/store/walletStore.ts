/**
 * walletStore.ts
 *
 * Zustand store for Freighter wallet connection.
 * Uses @stellar/freighter-api for real wallet integration.
 * Falls back to a mock address when Freighter is not installed (dev mode).
 */

import { create } from "zustand";
import {
  isConnected as freighterIsConnected,
  getAddress,
  isAllowed,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";
import { analytics } from "@/lib/analytics";
import { mockConnectWallet } from "@/lib/stellar";
import { NETWORK_PASSPHRASE } from "@/lib/constants";

// ─── Position type (persists in store after intent execution) ─────────────────
export interface Position {
  id: string;
  amount: number;
  tenorDays: number;
  lockedApr: number;
  createdAt: string;   // ISO date string
  maturityAt: string;  // ISO date string
}

// ─── Store shape ───────────────────────────────────────────────────────────────
interface WalletState {
  isConnected: boolean;
  address: string;
  balance: number;          // mock USDC balance for UI
  connecting: boolean;
  isMock: boolean;          // true when using mock wallet (Freighter not found)
  positions: Position[];

  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  addPosition: (p: Omit<Position, "id" | "createdAt">) => void;

  /**
   * Sign a transaction XDR string via Freighter.
   * Returns the signed XDR. Falls back gracefully if Freighter unavailable.
   */
  signTx: (
    xdrB64: string,
    opts?: { network: string; networkPassphrase: string },
  ) => Promise<string>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  isConnected: false,
  address: "",
  balance: 0,
  connecting: false,
  isMock: false,
  positions: [],

  // ── Connect wallet ──────────────────────────────────────────────────────────
  connectWallet: async () => {
    if (get().connecting || get().isConnected) return;
    set({ connecting: true });

    try {
      // ── Try real Freighter ──────────────────────────────────────────────
      const connResult = await freighterIsConnected();
      const connected = connResult.isConnected;

      if (connected) {
        // Ensure the dApp is allowed (prompts user if not)
        const allowedResult = await isAllowed();
        if (!allowedResult.isAllowed) {
          await requestAccess();
        }

        const addrResult = await getAddress();
        const publicKey = addrResult.address;

        if (publicKey) {
          set({
            isConnected: true,
            address: publicKey,
            balance: 1000, // mock USDC balance — real balance fetched separately
            connecting: false,
            isMock: false,
          });
          analytics.wallet_connected(publicKey);
          return;
        }
      }

      // ── Freighter not installed → open download page + use mock ─────────
      console.warn("[wallet] Freighter not found — using mock wallet");
      window.open("https://freighter.app", "_blank");

      const { address, balance } = await mockConnectWallet();
      set({
        isConnected: true,
        address,
        balance,
        connecting: false,
        isMock: true,
      });
      analytics.wallet_connected(address);
    } catch (err) {
      console.error("[wallet] Connection error:", err);
      set({ connecting: false });
      throw err;
    }
  },

  // ── Disconnect ──────────────────────────────────────────────────────────────
  disconnectWallet: () =>
    set({ isConnected: false, address: "", balance: 0, positions: [], isMock: false }),

  // ── Add a new position after intent execution ───────────────────────────────
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

  // ── Sign a transaction via Freighter ───────────────────────────────────────
  signTx: async (xdrB64, opts) => {
    if (get().isMock) {
      // In mock mode return the XDR unchanged (for UI-only flow)
      return xdrB64;
    }
    const result = await signTransaction(xdrB64, {
      networkPassphrase: opts?.networkPassphrase ?? NETWORK_PASSPHRASE,
    });
    // Freighter v1 returns { signedTxXdr } | string — handle both
    if (typeof result === "string") return result;
    if (result && typeof result === "object" && "signedTxXdr" in result) {
      return (result as { signedTxXdr: string }).signedTxXdr;
    }
    throw new Error("Unexpected Freighter signTransaction response");
  },
}));
