/**
 * stellar.ts
 *
 * Wrapper around @stellar/stellar-sdk for Soroban contract interactions,
 * XLM <-> USDC market path conversions, and real Testnet on-chain executions.
 */

import {
  rpc,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  nativeToScVal,
  scValToNative,
  xdr,
  Address,
} from "@stellar/stellar-sdk";
import { CONTRACT_IDS, NETWORK_PASSPHRASE, SOROBAN_RPC_URL, HORIZON_URL, SIM_CALLER } from "./constants";

// ─── RPC server ──────────────────────────────────────────────────────────────
const server = new rpc.Server(SOROBAN_RPC_URL, { allowHttp: false });

// ─── Low-level helpers ───────────────────────────────────────────────────────

/**
 * Simulate a read-only contract call and return the native JS value.
 * Throws if the simulation reports an error.
 */
export async function simulateContractCall(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  callerAddress: string = SIM_CALLER,
): Promise<unknown> {
  const account = await server.getAccount(callerAddress);
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation error: ${(simResult as rpc.Api.SimulateTransactionErrorResponse).error}`);
  }

  const ok = simResult as rpc.Api.SimulateTransactionSuccessResponse;
  return ok.result ? scValToNative(ok.result.retval) : null;
}

/**
 * Build, simulate, sign (via Freighter), and submit a state-changing transaction.
 * Polls until SUCCESS or FAILED.
 */
export async function submitContractCall(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  callerAddress: string,
  signTransaction: (xdrB64: string, opts?: { network: string; networkPassphrase: string }) => Promise<string>,
): Promise<string> {
  const account = await server.getAccount(callerAddress);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error((simResult as rpc.Api.SimulateTransactionErrorResponse).error);
  }

  const assembled = rpc
    .assembleTransaction(tx, simResult as rpc.Api.SimulateTransactionSuccessResponse)
    .build();

  const signedXdr = await signTransaction(assembled.toXDR(), {
    network: "TESTNET",
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const response = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE),
  );

  if (response.status === "ERROR") {
    const xdrBuf = response.errorResult?.toXDR();
    throw new Error(xdrBuf ? Buffer.from(xdrBuf).toString("hex") : "Transaction submission error");
  }

  // Poll for confirmation (max 30s)
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await server.getTransaction(response.hash);
    if (poll.status === rpc.Api.GetTransactionStatus.SUCCESS) return response.hash;
    if (poll.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error("Transaction failed on-chain");
    }
  }

  return response.hash;
}

// ─── XLM <-> USDC DEX Market Conversion Rate ─────────────────────────────────

/** Fetch real-time XLM -> USDC market conversion rate from Stellar Horizon Testnet */
export async function getXLMToUSDCRate(): Promise<number> {
  try {
    const url = `${HORIZON_URL}/orderbook?selling_asset_type=native&buying_asset_type=credit_alphanum4&buying_asset_code=USDC&buying_asset_issuer=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Horizon request failed");
    const data = await res.json();
    if (data.bids && data.bids.length > 0) {
      const bestBidPrice = parseFloat(data.bids[0].price);
      if (bestBidPrice > 0) return bestBidPrice;
    }
  } catch {
    // Horizon orderbook fallback estimation on testnet
  }
  return 0.125; // ~1 XLM = 0.125 USDC
}

// ─── Real On-Chain Contract Actions ──────────────────────────────────────────

/** Execute Intent on-chain via Intent Router contract */
export async function executeIntentOnChain(
  userAddress: string,
  usdcAmount: number,
  targetRateBps: number,
  tenorDays: number,
  signFn: (xdrB64: string, opts?: { network: string; networkPassphrase: string }) => Promise<string>,
): Promise<string> {
  if (!CONTRACT_IDS.intent_router) {
    throw new Error("Intent Router contract ID is not configured");
  }

  const args = [
    Address.fromString(userAddress).toScVal(),
    nativeToScVal(BigInt(Math.floor(usdcAmount * 1e7)), { type: "i128" }),
    nativeToScVal(BigInt(targetRateBps), { type: "i128" }),
    nativeToScVal(tenorDays, { type: "u32" }),
  ];

  return await submitContractCall(
    CONTRACT_IDS.intent_router,
    "execute_intent",
    args,
    userAddress,
    signFn,
  );
}

/** Execute PT Token Redemption on-chain when position matures */
export async function executeRedemptionOnChain(
  userAddress: string,
  ptTokenContractId: string,
  amount: number,
  signFn: (xdrB64: string, opts?: { network: string; networkPassphrase: string }) => Promise<string>,
): Promise<string> {
  const args = [
    Address.fromString(userAddress).toScVal(),
    nativeToScVal(BigInt(Math.floor(amount * 1e7)), { type: "i128" }),
  ];

  return await submitContractCall(
    ptTokenContractId,
    "burn",
    args,
    userAddress,
    signFn,
  );
}

// ─── Domain-level helpers ─────────────────────────────────────────────────────

/** Fetch Total Value Locked from the vault contract. Falls back to 0. */
export async function getVaultTVL(): Promise<number> {
  if (!CONTRACT_IDS.vault) return 0;
  try {
    const result = (await simulateContractCall(CONTRACT_IDS.vault, "get_tvl", [])) as bigint;
    return Number(result) / 1e7;
  } catch {
    return 0;
  }
}

/** Fetch APY from vault (in %). Falls back to 15.2. */
export async function getVaultAPY(): Promise<number> {
  if (!CONTRACT_IDS.vault) return 15.2;
  try {
    const result = (await simulateContractCall(CONTRACT_IDS.vault, "get_apy_bps", [])) as bigint;
    return Number(result) / 100;
  } catch {
    return 15.2;
  }
}

/** Get a live quote from the intent router. Falls back to computed mock. */
export async function quoteIntent(
  usdcAmount: number,
  targetRateBps: number,
  tenorDays: number,
): Promise<{
  ptAmount: number;
  impliedRateBps: number;
  maturityTimestamp: number;
  achievable: boolean;
}> {
  if (CONTRACT_IDS.intent_router && usdcAmount > 0) {
    try {
      const args = [
        nativeToScVal(BigInt(Math.floor(usdcAmount * 1e7)), { type: "i128" }),
        nativeToScVal(BigInt(targetRateBps), { type: "i128" }),
        nativeToScVal(tenorDays, { type: "u32" }),
      ];
      const result = (await simulateContractCall(
        CONTRACT_IDS.intent_router,
        "quote_intent",
        args,
      )) as Record<string, bigint | boolean>;

      return {
        ptAmount: Number(result.pt_amount) / 1e7,
        impliedRateBps: Number(result.implied_rate_bps),
        maturityTimestamp: Number(result.maturity_timestamp),
        achievable: Boolean(result.achievable),
      };
    } catch {
      // fall through to computed formula
    }
  }

  return _computeQuoteMock(usdcAmount, tenorDays, targetRateBps);
}

export interface Quote {
  impliedApr: number;
  ptReceived: number;
  executionCostUsdc: number;
  maturityDate: string;
}

/** Compute a live quote for UI display */
export function computeQuote(amount: number, tenorDays: number, targetApr: number): Quote {
  const baseApr = 15.2;
  const impliedApr = Math.max(5, Math.min(30, baseApr + (targetApr - baseApr) * 0.05));
  const ptReceived = amount > 0 ? amount * (1 + (impliedApr / 100) * (tenorDays / 365)) : 0;
  const fee = amount > 0 ? Math.max(0.1, amount * 0.001) : 0;
  const maturity = new Date();
  maturity.setDate(maturity.getDate() + tenorDays);
  return {
    impliedApr: Math.round(impliedApr * 100) / 100,
    ptReceived: Math.round(ptReceived * 100) / 100,
    executionCostUsdc: Math.round(fee * 100) / 100,
    maturityDate: maturity.toISOString(),
  };
}

function _computeQuoteMock(
  usdcAmount: number,
  tenorDays: number,
  targetRateBps: number,
): {
  ptAmount: number;
  impliedRateBps: number;
  maturityTimestamp: number;
  achievable: boolean;
} {
  const baseApyBps = 1520;
  const impliedApyBps = baseApyBps;
  const impliedRateBps = Math.floor((impliedApyBps * tenorDays) / 365);
  const discountBps = Math.floor((impliedRateBps * 10_000) / (10_000 + impliedRateBps));
  const ptAmount = usdcAmount > 0 ? (usdcAmount * (10_000 - discountBps)) / 10_000 : 0;
  return {
    ptAmount: Math.round(ptAmount * 100) / 100,
    impliedRateBps,
    maturityTimestamp: Math.floor(Date.now() / 1000) + tenorDays * 86400,
    achievable: impliedRateBps >= targetRateBps,
  };
}

export function generateTxHash(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
