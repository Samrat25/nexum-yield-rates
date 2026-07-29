/**
 * walletStore.ts
 *
 * Zustand store for Freighter wallet connection.
 * Fetches REAL on-chain XLM and USDC balances from Stellar Horizon Testnet.
 */

import { create } from "zustand";
import freighterPkg from "@stellar/freighter-api";
import { analytics } from "@/lib/analytics";
import { NETWORK_PASSPHRASE } from "@/lib/constants";
import { getRealOnChainBalances } from "@/lib/stellar";

// Handles CJS default export resolution across SSR and Client environments
const freighter = (freighterPkg as unknown as { default?: typeof freighterPkg }).default ?? freighterPkg;
const freighterIsConnected = freighter.isConnected;
const getAddress = freighter.getAddress;
const isAllowed = freighter.isAllowed;
const requestAccess = freighter.requestAccess;
const signTransaction = freighter.signTransaction;

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
  balance: number;          // REAL USDC balance on-chain
  xlmBalance: number;       // REAL XLM balance on-chain
  connecting: boolean;
  isMock: boolean;          // true only when Freighter extension is not installed
  positions: Position[];

  connectWallet: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  disconnectWallet: () => void;
  addPosition: (p: Omit<Position, "id" | "createdAt">) => void;

  /**
   * Sign a transaction XDR string via Freighter.
   * Triggers real Freighter browser extension pop-up!
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
  xlmBalance: 0,
  connecting: false,
  isMock: false,
  positions: [],

  // ── Refresh real on-chain balances ───────────────────────────────────────────
  refreshBalances: async () => {
    const { address } = get();
    if (!address) return;
    const balances = await getRealOnChainBalances(address);
    set({ balance: balances.usdc, xlmBalance: balances.xlm });
  },

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
          // Fetch REAL on-chain XLM and USDC balances for this address!
          const balances = await getRealOnChainBalances(publicKey);

          set({
            isConnected: true,
            address: publicKey,
            balance: balances.usdc,
            xlmBalance: balances.xlm,
            connecting: false,
            isMock: false,
          });
          analytics.wallet_connected(publicKey);
          return;
        }
      }

      // ── Freighter not installed → prompt user to install extension ────────
      console.warn("[wallet] Freighter extension not installed");
      window.open("https://freighter.app", "_blank");

      set({
        isConnected: false,
        address: "",
        balance: 0,
        xlmBalance: 0,
        connecting: false,
        isMock: true,
      });
    } catch (err) {
      console.error("[wallet] Connection error:", err);
      set({ connecting: false });
      throw err;
    }
  },

  // ── Disconnect ──────────────────────────────────────────────────────────────
  disconnectWallet: () =>
    set({ isConnected: false, address: "", balance: 0, xlmBalance: 0, positions: [], isMock: false }),

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

  // ── Sign a transaction via Freighter Extension Pop-up ─────────────────────────
  signTx: async (xdrB64, opts) => {
    const result = await signTransaction(xdrB64, {
      networkPassphrase: opts?.networkPassphrase ?? NETWORK_PASSPHRASE,
    });
    if (typeof result === "string") return result;
    if (result && typeof result === "object" && "signedTxXdr" in result) {
      return (result as { signedTxXdr: string }).signedTxXdr;
    }
    throw new Error("User rejected transaction or unexpected Freighter response");
  },
}));
