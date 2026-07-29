import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://placeholder-supabase.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface DbPosition {
  id?: string;
  user_address: string;
  pt_token_id: string;
  tenor_days: number;
  pt_amount: number;
  locked_apr: number;
  tx_hash: string;
  created_at: string;
  maturity_at: string;
  status: "active" | "redeemed" | "matured";
}

export interface DbTransaction {
  id?: string;
  tx_hash: string;
  user_address: string;
  type: "MINT_INTENT" | "REDEEM" | "SWAP_XLM_MINT";
  amount_usdc: number;
  amount_xlm?: number;
  pt_amount: number;
  locked_apr: number;
  tenor_days: number;
  status: "success" | "reverted" | "failed";
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

/** Save a position to Supabase (and mirror to localStorage) */
export async function dbSavePosition(pos: DbPosition): Promise<void> {
  const localKey = `nexum_pos_${pos.user_address}`;
  const existingStr = localStorage.getItem(localKey) || "[]";
  const existing: DbPosition[] = JSON.parse(existingStr);
  existing.unshift(pos);
  localStorage.setItem(localKey, JSON.stringify(existing));

  if (SUPABASE_URL.includes("placeholder")) return;

  try {
    await supabase.from("positions").insert([
      {
        user_address: pos.user_address,
        pt_token_id: pos.pt_token_id,
        tenor_days: pos.tenor_days,
        pt_amount: pos.pt_amount,
        locked_apr: pos.locked_apr,
        tx_hash: pos.tx_hash,
        maturity_at: pos.maturity_at,
        status: pos.status,
      },
    ]);
  } catch (err) {
    console.warn("[supabase] error saving position:", err);
  }
}

/** Fetch user positions from Supabase (fallback to local mirror) */
export async function dbGetPositions(userAddress: string): Promise<DbPosition[]> {
  const localKey = `nexum_pos_${userAddress}`;
  const local: DbPosition[] = JSON.parse(localStorage.getItem(localKey) || "[]");

  if (SUPABASE_URL.includes("placeholder")) return local;

  try {
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .eq("user_address", userAddress)
      .order("created_at", { ascending: false });

    if (error || !data) return local;
    return data as DbPosition[];
  } catch {
    return local;
  }
}

/** Save transaction record to Supabase */
export async function dbSaveTransaction(tx: DbTransaction): Promise<void> {
  const localKey = `nexum_txs_${tx.user_address}`;
  const existing: DbTransaction[] = JSON.parse(localStorage.getItem(localKey) || "[]");
  existing.unshift(tx);
  localStorage.setItem(localKey, JSON.stringify(existing));

  if (SUPABASE_URL.includes("placeholder")) return;

  try {
    await supabase.from("transactions").insert([
      {
        tx_hash: tx.tx_hash,
        user_address: tx.user_address,
        type: tx.type,
        amount_usdc: tx.amount_usdc,
        amount_xlm: tx.amount_xlm,
        pt_amount: tx.pt_amount,
        locked_apr: tx.locked_apr,
        tenor_days: tx.tenor_days,
        status: tx.status,
      },
    ]);
  } catch (err) {
    console.warn("[supabase] error saving transaction:", err);
  }
}

/** Fetch transaction history from Supabase */
export async function dbGetTransactions(userAddress: string): Promise<DbTransaction[]> {
  const localKey = `nexum_txs_${userAddress}`;
  const local: DbTransaction[] = JSON.parse(localStorage.getItem(localKey) || "[]");

  if (SUPABASE_URL.includes("placeholder")) return local;

  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_address", userAddress)
      .order("created_at", { ascending: false });

    if (error || !data) return local;
    return data as DbTransaction[];
  } catch {
    return local;
  }
}

/** Record quote request in local telemetry mirror for analytics & telemetry */
export async function dbSaveQuote(quote: DbQuote): Promise<void> {
  try {
    const existing = JSON.parse(localStorage.getItem("nexum_quotes") || "[]");
    existing.unshift(quote);
    localStorage.setItem("nexum_quotes", JSON.stringify(existing.slice(0, 50)));
  } catch {
    // Ignore local storage error
  }
}
