// ─── Stellar / Soroban network constants ────────────────────────────────────
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

// ─── Contract IDs (populated from .env.local after deployment) ───────────────
export const CONTRACT_IDS = {
  vault:         import.meta.env.VITE_VAULT_ID         ?? "",
  pt_30d:        import.meta.env.VITE_PT30D_ID         ?? "",
  pt_90d:        import.meta.env.VITE_PT90D_ID         ?? "",
  pt_180d:       import.meta.env.VITE_PT180D_ID        ?? "",
  intent_router: import.meta.env.VITE_ROUTER_ID        ?? "",
};

// ─── Tenor mapping ────────────────────────────────────────────────────────────
export const TENOR_DAYS: Record<string, number> = {
  "30D": 30,
  "90D": 90,
  "180D": 180,
};

// ─── A public account used only for simulation / read-only calls ──────────────
export const SIM_CALLER =
  "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";
