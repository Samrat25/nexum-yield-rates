import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://placeholder-supabase.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface DbPosition {
  id?: string;
  user_address: string;
  pt_token_id: string;
  tenor_days: number;
  pt_amount: number;           // original principal
  withdrawn_amount?: number;   // cumulative amount already withdrawn
  locked_apr: number;
  tx_hash: string;
  created_at: string;
  maturity_at: string;
  status: "active" | "partial" | "redeemed" | "matured";
}

export interface DbTransaction {
  id?: string;
  tx_hash: string;
  user_address: string;
  type: "MINT_INTENT" | "REDEEM" | "SWAP_XLM_MINT" | "PARTIAL_WITHDRAW" | "EARLY_WITHDRAW";
  amount_usdc: number;
  amount_xlm?: number;
  pt_amount: number;
  locked_apr: number;
  tenor_days: number;
  penalty_amount?: number;     // early withdrawal penalty in USDC
  net_received?: number;       // after penalty
  status: "pending" | "success" | "reverted" | "failed";
  created_at: string;
}

export interface DbQuote {
  id?: string;
  user_address: string;
  input_asset: "USDC" | "XLM";
  input_amount: number;
  target_apr: number;
  tenor_days: number;
  implied_apr: number;
  pt_amount: number;
  achievable: boolean;
  created_at: string;
}

// ─── Position helpers ─────────────────────────────────────────────────────────

const posKey = (addr: string) => `nexum_pos_${addr}`;
const txKey  = (addr: string) => `nexum_txs_${addr}`;

function readLocal<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full — ignore
  }
}

// ─── Save position ────────────────────────────────────────────────────────────
export async function dbSavePosition(pos: DbPosition): Promise<void> {
  const key = posKey(pos.user_address);
  const existing = readLocal<DbPosition>(key);
  existing.unshift(pos);
  writeLocal(key, existing);

  if (SUPABASE_URL.includes("placeholder")) return;
  try {
    await supabase.from("positions").upsert([
      {
        user_address: pos.user_address,
        pt_token_id: pos.pt_token_id,
        tenor_days: pos.tenor_days,
        pt_amount: pos.pt_amount,
        withdrawn_amount: pos.withdrawn_amount ?? 0,
        locked_apr: pos.locked_apr,
        tx_hash: pos.tx_hash,
        maturity_at: pos.maturity_at,
        status: pos.status,
        created_at: pos.created_at,
      },
    ]);
  } catch (err) {
    console.warn("[supabase] dbSavePosition:", err);
  }
}

// ─── Update position after withdrawal ────────────────────────────────────────
export async function dbUpdatePositionWithdrawal(
  userAddress: string,
  txHash: string,
  withdrawnAmount: number,
  newStatus: DbPosition["status"],
): Promise<void> {
  const key = posKey(userAddress);
  const positions = readLocal<DbPosition>(key);
  const idx = positions.findIndex((p) => p.tx_hash === txHash);

  if (idx >= 0) {
    const prev = positions[idx].withdrawn_amount ?? 0;
    positions[idx] = {
      ...positions[idx],
      withdrawn_amount: prev + withdrawnAmount,
      status: newStatus,
    };
    writeLocal(key, positions);
  }

  if (SUPABASE_URL.includes("placeholder")) return;
  try {
    await supabase
      .from("positions")
      .update({
        withdrawn_amount: (positions[idx]?.withdrawn_amount ?? withdrawnAmount),
        status: newStatus,
      })
      .eq("tx_hash", txHash)
      .eq("user_address", userAddress);
  } catch (err) {
    console.warn("[supabase] dbUpdatePositionWithdrawal:", err);
  }
}

// ─── Get positions ────────────────────────────────────────────────────────────
export async function dbGetPositions(userAddress: string): Promise<DbPosition[]> {
  const local = readLocal<DbPosition>(posKey(userAddress));
  if (SUPABASE_URL.includes("placeholder")) return local;

  try {
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .eq("user_address", userAddress)
      .order("created_at", { ascending: false });

    if (error || !data) return local;
    // Merge: remote is canonical, but include any local-only entries
    const remoteHashes = new Set(data.map((d) => d.tx_hash));
    const localOnly = local.filter((l) => !remoteHashes.has(l.tx_hash));
    return [...data, ...localOnly] as DbPosition[];
  } catch {
    return local;
  }
}

// ─── Save transaction ─────────────────────────────────────────────────────────
export async function dbSaveTransaction(tx: DbTransaction): Promise<void> {
  const key = txKey(tx.user_address);
  const existing = readLocal<DbTransaction>(key);
  // Update if same hash (status change from pending → success/failed)
  const idx = existing.findIndex((t) => t.tx_hash === tx.tx_hash);
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...tx };
  } else {
    existing.unshift(tx);
  }
  writeLocal(key, existing);

  if (SUPABASE_URL.includes("placeholder")) return;
  try {
    await supabase.from("transactions").upsert([
      {
        tx_hash: tx.tx_hash,
        user_address: tx.user_address,
        type: tx.type,
        amount_usdc: tx.amount_usdc,
        amount_xlm: tx.amount_xlm,
        pt_amount: tx.pt_amount,
        locked_apr: tx.locked_apr,
        tenor_days: tx.tenor_days,
        penalty_amount: tx.penalty_amount ?? 0,
        net_received: tx.net_received ?? tx.amount_usdc,
        status: tx.status,
        created_at: tx.created_at,
      },
    ]);
  } catch (err) {
    console.warn("[supabase] dbSaveTransaction:", err);
  }
}

// ─── Get transactions ─────────────────────────────────────────────────────────
export async function dbGetTransactions(userAddress: string): Promise<DbTransaction[]> {
  const local = readLocal<DbTransaction>(txKey(userAddress));
  if (SUPABASE_URL.includes("placeholder")) return local;

  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_address", userAddress)
      .order("created_at", { ascending: false });

    if (error || !data) return local;
    const remoteHashes = new Set(data.map((d) => d.tx_hash));
    const localOnly = local.filter((l) => !remoteHashes.has(l.tx_hash));
    return [...data, ...localOnly] as DbTransaction[];
  } catch {
    return local;
  }
}

// ─── Quote telemetry (local only) ────────────────────────────────────────────
export async function dbSaveQuote(quote: DbQuote): Promise<void> {
  try {
    const existing = JSON.parse(localStorage.getItem("nexum_quotes") || "[]");
    existing.unshift(quote);
    localStorage.setItem("nexum_quotes", JSON.stringify(existing.slice(0, 50)));
  } catch {
    // ignore
  }
}
